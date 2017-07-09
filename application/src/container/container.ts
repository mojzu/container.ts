import * as Debug from "debug";
import { AwilixContainer, createContainer, ResolutionMode, Lifetime } from "awilix";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import "rxjs/add/observable/of";
import "rxjs/add/observable/throw";
import "rxjs/add/observable/forkJoin";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/take";
import "rxjs/add/operator/timeout";
import { Environment } from "./environment";
import { LogLevel, ILogMessage, ILogMetadata, Logger } from "./log";

/** Container options injected by awilix library. */
export interface IContainerModuleOpts {
  [key: string]: any;
}

/** Container module constructor interface. */
export interface IContainerModuleConstructor {
  new (name: string, opts: IContainerModuleOpts): ContainerModule;
}

/** Container module dependencies. */
export interface IContainerModuleDepends {
  [key: string]: string;
}

/** Module state interface. */
export interface IContainerModuleState {
  [key: string]: boolean;
}

/** Container error class. */
export class ContainerError extends Error {
  public constructor(message: string) {
    const error: any = super(message);
    this.name = error.name = "ContainerError";
    this.stack = error.stack;
    this.message = error.message;
  }
}

/** Container log message interface. */
export interface IContainerLogMessage {
  level: LogLevel;
  message: ILogMessage;
  metadata: ILogMetadata;
  args: any[];
}

/** Log message class for stream of module logs. */
export class ContainerLogMessage implements IContainerLogMessage {
  public constructor(
    public level: LogLevel,
    public message: ILogMessage,
    public metadata: ILogMetadata,
    public args: any[],
  ) { }
}

/** Container bus message types. */
export type IContainerMessageTypes = ContainerLogMessage;

/** Container reference name used internally by modules. */
export const CONTAINER_NAME = "_container";

/** Wrapper around awilix library. */
export class Container {

  private _environment: Environment;
  private _container: AwilixContainer;
  private _modules = new BehaviorSubject<IContainerModuleState>({});
  private _bus = new Subject<IContainerMessageTypes>();

  /** Container name, used to namespace modules. */
  public get name(): string { return this._name; }

  /** Container environment reference available to modules. */
  public get environment(): Environment { return this._environment; }

  /** Array of registered module names. */
  public get modules(): string[] { return Object.keys(this._modules.value); }

  /** Container message bus. */
  public get bus(): Subject<IContainerMessageTypes> { return this._bus; }

  /** Creates a new container in proxy resolution mode. */
  public constructor(private _name: string, environment = new Environment()) {
    this._environment = environment;
    this._container = createContainer({ resolutionMode: ResolutionMode.PROXY });
    this.registerValue<Container>(CONTAINER_NAME, this);
  }

  /** Register a module in container, has singleton lifetime by default. */
  public registerModule<T extends IContainerModuleConstructor>(
    name: string,
    instance: T,
    lifetime = Lifetime.SINGLETON,
  ): Container {
    const options = {};
    options[name] = [this.makeModule.bind(this, name, instance), { lifetime }];
    this._container.registerFunction(options);
    this.reportModuleState(name, false);
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
    if (level != null) {
      filterLogs = filterLogs.filter((log) => log.level <= level);
    }
    return filterLogs;
  }

  /** Signal modules to enter operational state. */
  public start(timeout?: number): Observable<void> {
    return this.setModulesState(true, timeout);
  }

  /** Signal modules to leave operational state. */
  public stop(timeout?: number): Observable<void> {
    return this.setModulesState(false, timeout);
  }

  /** Wait for modules to start before calling next. */
  public waitStarted(...modules: string[]): Observable<void> {
    return this._modules
      .filter((states) => {
        return modules.reduce((previous, current) => {
          return previous && states[current];
        }, true);
      })
      .switchMap(() => Observable.of(undefined))
      .take(1);
  }

  /** Wait for modules to stop before calling next. */
  public waitStopped(...modules: string[]): Observable<void> {
    return this._modules
      .filter((states) => {
        return modules.reduce((previous, current) => {
          return previous || states[current];
        }, false);
      })
      .switchMap(() => Observable.of(undefined))
      .take(1);
  }

  /** Factory functions for modules. */
  protected makeModule<T extends IContainerModuleConstructor>(
    name: string,
    instance: T,
    opts: IContainerModuleOpts,
  ): ContainerModule {
    return new instance(name, opts);
  }

  /** Set modules state by calling start/stop methods. */
  protected setModulesState(state: boolean, timeout = 10000): Observable<void> {
    // Map module methods and report states.
    const modules = this.modules.map((name) => this._container.resolve<ContainerModule>(name));
    const observables = modules.map((mod) => {
      const method: () => Observable<void> = mod[state ? "start" : "stop"].bind(mod);
      return method().switchMap(() => this.reportModuleState(mod.name, state));
    });

    // Wait for modules to signal state.
    // Map TimeoutError to ContainerError.
    return Observable.forkJoin(...observables)
      .timeout(timeout)
      .catch((error: Error) => Observable.throw(new ContainerError(error.message)))
      .switchMap(() => {
        return Observable.of(undefined);
      });
  }

  /** Update and report module state via internal subject. */
  protected reportModuleState(name: string, state: boolean): Observable<void> {
    this._modules.value[name] = state;
    this._modules.next(this._modules.value);
    return Observable.of(undefined);
  }

}

/** Container module logger class. */
export class ContainerModuleLogger extends Logger {

  public constructor(
    private _container: Container,
    private _name: string,
  ) { super(); }

  /** Sends log message to container bus for consumption by modules. */
  protected log(level: LogLevel, message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    // Add module name to metadata.
    metadata = metadata || {};
    metadata.moduleName = this._name;
    this._container.sendLog(level, message, metadata, args);
  }

}

/** Base class for container class modules with dependency injection. */
export class ContainerModule {

  private _container: Container;
  private _name: string;
  private _log: ContainerModuleLogger;
  private _debug: Debug.IDebugger;

  /** Module container reference. */
  public get container(): Container { return this._container; }

  /** Module container environment reference. */
  public get environment(): Environment { return this._container.environment; }

  /** Module name. */
  public get name(): string { return this._name; }

  /** Module container and module names. */
  public get namespace(): string { return `${this.container.name}:${this.name}`; }

  /** Module log interface. */
  public get log(): ContainerModuleLogger { return this._log; }

  /** Module debug interface. */
  public get debug(): Debug.IDebugger { return this._debug; }

  public constructor(name: string, opts: IContainerModuleOpts, depends: IContainerModuleDepends = {}) {
    // Set name, resolve container instance and construct log, debug instances.
    this._name = name;
    this._container = opts[CONTAINER_NAME];
    this._log = new ContainerModuleLogger(this._container, this.namespace);
    this._debug = Debug(this.namespace);

    // Inject dependency values into instance.
    // Error is thrown by awilix if resolution failed.
    Object.keys(depends).map((key) => {
      const target = depends[key];
      this[key] = opts[target];
    });
  }

  /** Module operational state. */
  public start(): Observable<void> {
    return Observable.of(undefined);
  }

  /** Module non-operational state. */
  public stop(): Observable<void> {
    return Observable.of(undefined);
  }

}
