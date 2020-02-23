import { asFunction, asValue, AwilixContainer, createContainer, InjectionMode } from "awilix";
import * as Debug from "debug";
import { keys } from "lodash";
import { BehaviorSubject, from, Observable, Subject, throwError } from "rxjs";
import { catchError, filter, map, take, timeout as rxjsTimeout } from "rxjs/operators";
import { ErrorChain } from "../lib/error";
import { Environment } from "./environment";
import { ELogLevel, ILogMessage, ILogMetadata } from "./log";
import { EMetricType, IMetricTags } from "./metric";
import { Module } from "./module";

/** Command line arguments interface. */
export interface IContainerArguments {
  /** Non-option arguments. */
  arguments: string[];
  /** All remaining options. */
  options: object;
}

/** Container error codes. */
export enum EContainerError {
  Up = "ContainerError.Up",
  Down = "ContainerError.Down",
  ModuleRegistered = "ContainerError.ModuleRegistered"
}

/** Container error class. */
export class ContainerError extends ErrorChain {
  public constructor(code: EContainerError, cause?: Error, context?: object) {
    super({ name: "ContainerError", value: { code, ...context } }, cause);
  }
}

/** Container log message interface. */
export interface IContainerLogMessage {
  level: ELogLevel;
  message: ILogMessage;
  metadata: ILogMetadata;
  args: any[];
}

/** Log message class for stream of module logs. */
export class ContainerLogMessage implements IContainerLogMessage {
  public constructor(
    public readonly level: ELogLevel,
    public readonly message: ILogMessage,
    public readonly metadata: ILogMetadata,
    public readonly args: any[]
  ) {}
}

/** Container metric message interface. */
export interface IContainerMetricMessage {
  type: EMetricType;
  name: string;
  value: any;
  tags: IMetricTags;
  args: any[];
}

/** Metric message class for stream of module metrics. */
export class ContainerMetricMessage implements IContainerMetricMessage {
  public constructor(
    public readonly type: EMetricType,
    public readonly name: string,
    public readonly value: any,
    public readonly tags: IMetricTags,
    public readonly args: any[]
  ) {}
}

/** Container log names. */
export enum EContainerLog {
  Up = "Container.Up",
  Down = "Container.Down"
}

/** Container scope keys. */
export enum EContainerScope {
  /** Container reference name resolved internally by modules. */
  Container = "Container"
}

/**
 * Container class.
 * Wrapper around awilix library.
 */
export class Container {
  /** Root container. */
  public readonly container: AwilixContainer;

  /** Observable module state. */
  public readonly modules$ = new BehaviorSubject<{ [key: string]: boolean }>({});

  /** Array of registered module names. */
  public get moduleNames(): string[] {
    return keys(this.modules$.value);
  }

  /** Array of registered modules. */
  public get modules(): Module[] {
    return this.moduleNames.map((n) => this.container.resolve<Module>(n));
  }

  /** Container module logs. */
  public readonly logs$ = new Subject<ContainerLogMessage>();

  /** Container module metrics. */
  public readonly metrics$ = new Subject<ContainerMetricMessage>();

  /** Module debug interface. */
  public readonly debug: Debug.IDebugger;

  /** Creates a new container in proxy resolution mode. */
  public constructor(
    /** Required container name, used to namespace modules. */
    public readonly name: string,
    /** Optional container environment. */
    public readonly environment = new Environment(),
    /** Optional command line arguments. */
    public readonly argv: IContainerArguments = { arguments: [], options: {} }
  ) {
    this.debug = Debug(this.name);
    this.container = createContainer({ injectionMode: InjectionMode.PROXY });
    this.registerValue<Container>(EContainerScope.Container, this);
  }

  /** Create scoped container from root container. */
  public createScope(): AwilixContainer {
    return this.container.createScope();
  }

  /**
   * Register a module in container.
   * Throws an error if module of name is already registered.
   */
  public registerModule<T extends typeof Module>(moduleClass: T): Container {
    if (this.containerModuleRegistered(moduleClass.moduleName)) {
      throw new ContainerError(EContainerError.ModuleRegistered, undefined, { moduleName: moduleClass.moduleName });
    }

    const factoryFunction = (opts: any) => this.containerModuleFactory(moduleClass, opts);
    this.container.register({ [moduleClass.moduleName]: asFunction(factoryFunction).singleton() });
    this.containerModuleState(moduleClass.moduleName, false);
    return this;
  }

  /** Register named modules in container. */
  public registerModules<T extends typeof Module>(modules: T[]): Container {
    modules.map((mod) => this.registerModule(mod));
    return this;
  }

  /** Register a value of type in container. */
  public registerValue<T>(name: string, value: T): Container {
    this.container.register({ [name]: asValue(value) });
    return this;
  }

  /** Resolve value or module of type from container by name. */
  public resolve<T>(name: string): T {
    return this.container.resolve<T>(name);
  }

  /** Send log message of level for module. */
  public sendLog(level: ELogLevel, message: ILogMessage, metadata: ILogMetadata, args: any[]): void {
    this.logs$.next(new ContainerLogMessage(level, message, metadata, args));
  }

  /** Send metric message of type for module. */
  public sendMetric(type: EMetricType, name: string, value: any, tags: IMetricTags, args: any[]): void {
    this.metrics$.next(new ContainerMetricMessage(type, name, value, tags, args));
  }

  /** Observable stream of module logs filtered by level. */
  public filterLogs(level: ELogLevel): Observable<ContainerLogMessage> {
    return this.logs$.pipe(filter((m) => m.level <= level));
  }

  /** Observable stream of module metrics filtered by type. */
  public filterMetrics(type: EMetricType): Observable<ContainerMetricMessage> {
    return this.metrics$.pipe(filter((m) => m.type === type));
  }

  /**
   * Signal modules to enter operational state.
   * Module hook method `moduleUp` called in order of dependencies.
   */
  public async up(timeout?: number): Promise<number> {
    const hooks = this.modules.map(async (mod) => {
      // Wait for module dependencies and then call module up hooks.
      await this.containerWhenModulesUp(...this.containerModuleDependencies(mod));
      return this.containerModuleStateTimeout(mod.moduleUp(), mod.moduleName, true, timeout);
    });
    return this.containerState(hooks, true);
  }

  /**
   * Signal modules to leave operational state.
   * Module hook method `moduleDown` called in order of dependents.
   */
  public async down(timeout?: number): Promise<number> {
    const hooks = this.modules.map(async (mod) => {
      // Wait for module dependents and then call module down hooks.
      await this.containerWhenModulesDown(...this.containerModuleDependents(mod));
      return this.containerModuleStateTimeout(mod.moduleDown(), mod.moduleName, false, timeout);
    });
    return this.containerState(hooks, false);
  }

  /** Call modules destroy hooks before process exit. */
  public destroy(): void {
    this.modules.map((mod) => mod.moduleDestroy());

    // Observables clean up.
    this.modules$.complete();
    this.logs$.complete();
    this.metrics$.complete();
  }

  /** Wait for modules to enter operational state before calling next. */
  protected containerWhenModulesUp(...modules: string[]): Promise<void> {
    return this.modules$
      .pipe(
        filter((states) => {
          return modules.reduce((previous: boolean, current) => {
            return previous && states[current];
          }, true);
        }),
        map(() => undefined),
        take(1)
      )
      .toPromise();
  }

  /** Wait for modules to leave operational state before calling next. */
  protected containerWhenModulesDown(...modules: string[]): Promise<void> {
    return this.modules$
      .pipe(
        filter((states) => {
          return !modules.reduce((previous, current) => {
            return previous || states[current];
          }, false);
        }),
        map(() => undefined),
        take(1)
      )
      .toPromise();
  }

  /** Create a new instance of module class. */
  protected containerModuleFactory<T extends typeof Module>(moduleClass: T, opts: any): Module {
    return new moduleClass({ moduleName: moduleClass.moduleName, opts });
  }

  /** Returns list of module names which are dependencies of target module. */
  protected containerModuleDependencies(mod: Module): string[] {
    const dependencies = mod.moduleDependencies();
    return keys(dependencies).map((k) => dependencies[k].moduleName);
  }

  /** Returns list of module names which are dependents of target module. */
  protected containerModuleDependents(mod: Module): string[] {
    const dependents: string[] = [];
    this.modules.map((m) => {
      const dependencies = m.moduleDependencies();
      const dependent = keys(dependencies).reduce((previous, key) => {
        return previous || dependencies[key].moduleName === mod.moduleName;
      }, false);

      if (dependent) {
        dependents.push(m.moduleName);
      }
    });
    return dependents;
  }

  /** Returns true if module is already registered in container. */
  protected containerModuleRegistered(name: string): boolean {
    return this.modules$.value[name] != null;
  }

  /** Wrap module hook promise with timeout operator, call containerModuleState on next. */
  protected containerModuleStateTimeout(
    hook: Promise<void>,
    moduleName: string,
    state: boolean,
    timeout = 10000
  ): Promise<void> {
    return from(hook)
      .pipe(
        rxjsTimeout(timeout),
        catchError((error) => {
          // Catch and wrap timeout errors with ContainerError.
          const errorName = state ? EContainerError.Up : EContainerError.Down;
          return throwError(new ContainerError(errorName, error, { moduleName }));
        }),
        map(() => this.containerModuleState(moduleName, state))
      )
      .toPromise();
  }

  /** Update observable modules state for target module. */
  protected containerModuleState(name: string, state: boolean): void {
    const next = { ...this.modules$.value, [name]: state };
    this.modules$.next(next);
  }

  /** Internal handler for `up` and `down` methods of class. */
  protected containerState(hooks: Promise<void>[], state: boolean): Promise<number> {
    return from(Promise.all(hooks))
      .pipe(
        map(() => {
          const message = state ? EContainerLog.Up : EContainerLog.Down;
          this.sendLog(ELogLevel.Informational, message, { name: this.name }, []);
          return this.moduleNames.length;
        })
      )
      .toPromise();
  }
}
