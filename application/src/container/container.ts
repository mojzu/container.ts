import * as debug from "debug";
import { AwilixContainer, createContainer, ResolutionMode, Lifetime } from "awilix";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/filter";
import { LogLevel, Logger } from "./log";

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
    public message: string,
    public moduleName: string,
    public args: any[],
  ) { }

  /** Basic string representation for console logging. */
  public toString(): string {
    let output = `[${this.level}][${this.moduleName}] ${this.message}`;
    if (this.args.length > 0) {
      output += ` [${this.args.join(", ")}]`;
    }
    return output;
  }

}

/** Container bus message types. */
export type ContainerMessageTypes = ContainerLogMessage;

/** Wrapper around awilix library. */
export class Container {

  private _container: AwilixContainer;
  private _modules: string[] = [];
  private _bus = new Subject<ContainerMessageTypes>();

  /** Creates a new container in proxy resolution mode. */
  public constructor() {
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
  public sendLog(level: LogLevel, message: string, moduleName: string, args: any[]): void {
    this._bus.next(new ContainerLogMessage(level, message, moduleName, args));
  }

  /** Observable stream of module logs, optional level filter. */
  public getLogs(level?: LogLevel): Observable<ContainerLogMessage> {
    let filterLogs = this._bus.filter((message) => message instanceof ContainerLogMessage);
    if (level != undefined) {
      filterLogs = filterLogs.filter((log) => log.level <= level);
    }
    return filterLogs;
  }

  // TODO: Implement this.
  public up() {
    this._modules.map((name) => {
      const mod = this._container.resolve<ContainerModule>(name);
      mod.up();
    });
  }

  public down() { }

}

/** Container module logger class. */
export class ContainerModuleLogger extends Logger {

  public constructor(
    private _container: Container,
    private _name: string,
  ) { super(); }

  /** Sends log message to container bus for consumption by module. */
  protected log(level: LogLevel, message: string, args: any[]): void {
    this._container.sendLog(level, message, this._name, args);
  }

}

/** Base class for container class modules with dependency injection. */
export class ContainerModule {

  private _container: Container;
  private _log: ContainerModuleLogger;
  private _debug: debug.IDebugger;

  public get container(): Container { return this._container; }
  public get log(): ContainerModuleLogger { return this._log; }
  public get debug(): debug.IDebugger { return this._debug; }

  public constructor(opts: IContainerOpts, name: string, depends: IContainerDepends = {}) {
    // Resolve container instance, construct log and debug instances.
    this._container = opts[CONTAINER_NAME];
    this._log = new ContainerModuleLogger(this._container, name);
    this._debug = debug(name);

    // Inject dependency values into instance.
    // Error is thrown by awilix if resolution failed.
    Object.keys(depends).map((key) => {
      const target = depends[key];
      this[key] = opts[target];
    });
  }

  // TODO: State callbacks.
  public up() { }

}