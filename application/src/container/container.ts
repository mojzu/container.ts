import * as Debug from "debug";
import { AwilixContainer, createContainer, ResolutionMode, Lifetime } from "awilix";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/of";
import "rxjs/add/observable/forkJoin";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/switchMap";
import { LogLevel, ILogMessage, ILogMetadata, Logger } from "./log";

/** Container options injected by awilix library. */
export interface IContainerOpts {
  [key: string]: any;
}

/** Container module dependencies. */
export interface IContainerDepends {
  [key: string]: string;
}

/** Container reference name used internally by modules. */
export const CONTAINER_NAME = "_container";

/** Log message class for stream of module logs. */
export class ContainerLogMessage {
  public constructor(
    public level: LogLevel,
    public message: ILogMessage,
    public metadata: ILogMetadata,
    public args: any[],
  ) { }
}

/** Container bus message types. */
export type ContainerMessageTypes = ContainerLogMessage;

/** Wrapper around awilix library. */
export class Container {

  private _container: AwilixContainer;
  private _modules: string[] = [];
  private _bus = new Subject<ContainerMessageTypes>();

  public get name(): string { return this._name; }
  public get modules(): string[] { return this._modules; }
  public get bus(): Subject<ContainerMessageTypes> { return this._bus; }

  /** Creates a new container in proxy resolution mode. */
  public constructor(private _name: string) {
    this._container = createContainer({ resolutionMode: ResolutionMode.PROXY });
    this._container.registerValue(CONTAINER_NAME, this);
  }

  /** Register a module in container, has singleton lifetime by default. */
  public registerModule<T>(name: string, instance: T, lifetime = Lifetime.SINGLETON): Container {
    const options = {};
    options[name] = [instance, { lifetime }];
    this._container.registerClass(options);
    this._modules.push(name);
    return this;
  }

  /** Register a value in container. */
  public registerValue<T>(name: string, value: T): Container {
    this._container.registerValue(name, value);
    return this;
  }

  /** Resolve module in container by name. */
  public resolve<T>(name: string): T {
    return this._container.resolve<T>(name);
  }

  /** Send log message of level for module. */
  public sendLog(level: LogLevel, message: ILogMessage, metadata: ILogMetadata, args: any[]): void {
    this._bus.next(new ContainerLogMessage(level, message, metadata, args));
  }

  /** Observable stream of module logs, optional level filter. */
  public getLogs(level?: LogLevel): Observable<ContainerLogMessage> {
    let filterLogs = this._bus.filter((message) => message instanceof ContainerLogMessage);
    if (level != undefined) {
      filterLogs = filterLogs.filter((log) => log.level <= level);
    }
    return filterLogs;
  }

  /** Signal modules to enter operational state. */
  public up(): Observable<void> {
    const modules = this._modules.map((name) => this._container.resolve<ContainerModule>(name));
    const observables = modules.map((mod) => mod.up());

    // Wait for each module to signal operational state.
    // TODO: Add startup timeout.
    return Observable.forkJoin(...observables)
      .switchMap(() => {
        return Observable.of(undefined);
      });
  }

  /** Signal modules to leave operational state. */
  public down(): Observable<void> {
    const modules = this._modules.map((name) => this._container.resolve<ContainerModule>(name));
    const observables = modules.map((mod) => mod.down());

    // Wait for each module to signal non-operational state.
    return Observable.forkJoin(...observables)
      .switchMap(() => {
        return Observable.of(undefined);
      });
  }

}

/** Container module logger class. */
export class ContainerModuleLogger extends Logger {

  public constructor(
    private _container: Container,
    private _name: string,
  ) { super(); }

  /** Sends log message to container bus for consumption by module. */
  protected log(level: LogLevel, message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    // Add module name metadata by default.
    metadata = metadata || {};
    metadata.moduleName = this._name;
    this._container.sendLog(level, message, metadata, args);
  }

}

/** Base class for container class modules with dependency injection. */
export class ContainerModule {

  private _container: Container;
  private _log: ContainerModuleLogger;
  private _debug: Debug.IDebugger;

  public get container(): Container { return this._container; }
  public get log(): ContainerModuleLogger { return this._log; }
  public get debug(): Debug.IDebugger { return this._debug; }

  public constructor(opts: IContainerOpts, name: string, depends: IContainerDepends = {}) {
    // Resolve container instance, construct log and debug instances.
    this._container = opts[CONTAINER_NAME];
    const namespace = `${this.container.name}:${name}`;
    this._log = new ContainerModuleLogger(this._container, namespace);
    this._debug = Debug(namespace);

    // Inject dependency values into instance.
    // Error is thrown by awilix if resolution failed.
    Object.keys(depends).map((key) => {
      const target = depends[key];
      this[key] = opts[target];
    });
  }

  /** Module operational state. */
  public up(): Observable<void> {
    return Observable.of(undefined);
  }

  /** Module non-operational state. */
  public down(): Observable<void> {
    return Observable.of(undefined);
  }

}
