import { asFunction, asValue, AwilixContainer, createContainer, InjectionMode } from "awilix";
import * as Debug from "debug";
import { keys } from "lodash";
import { BehaviorSubject, forkJoin, from, Observable, of, Subject, throwError } from "rxjs";
import { catchError, filter, map, switchMap, take, timeout as rxjsTimeout } from "rxjs/operators";
import { ErrorChain } from "../lib/error";
import { Environment } from "./Environment";
import { ELogLevel, ILogMessage, ILogMetadata } from "./Log";
import { EMetricType, IMetricTags } from "./Metric";
import { Module } from "./Module";

/** Command line arguments interface matching `yargs` package. */
export interface IContainerArguments {
  /** Non-option arguments. */
  _: string[];
  /** The script name or node command. */
  $0: string;
  /** All remaining options. */
  [argName: string]: any;
}

/** Container error class. */
export class ContainerError extends ErrorChain {
  public constructor(name: string, cause?: Error, moduleName?: string) {
    super({ name, value: moduleName }, cause);
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

/** Container error names. */
export enum EContainerError {
  Up = "ContainerError.Up",
  Down = "ContainerError.Down",
  ModuleRegistered = "ContainerError.ModuleRegistered"
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
    public readonly argv: IContainerArguments = { _: [], $0: "" }
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
      throw new ContainerError(EContainerError.ModuleRegistered);
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
  public up(timeout?: number): Observable<void> {
    const observables$ = this.modules.map((mod) => {
      return this.containerWhenModulesUp(...this.containerModuleDependencies(mod)).pipe(
        switchMap(() => {
          const up$ = mod.moduleUp();

          if (up$ == null) {
            // Module up returned void, set state now.
            return this.containerModuleState(mod.moduleName, true, timeout);
          } else if (up$ instanceof Observable) {
            // Observable returned, update state on next.
            return up$.pipe(switchMap(() => this.containerModuleState(mod.moduleName, true, timeout)));
          } else {
            // Promise returned, update state on then.
            return from(up$).pipe(switchMap(() => this.containerModuleState(mod.moduleName, true, timeout)));
          }
        })
      );
    });
    return this.containerState(observables$, true);
  }

  /**
   * Signal modules to leave operational state.
   * Module hook method `moduleDown` called in order of dependents.
   */
  public down(timeout?: number): Observable<void> {
    const observables$ = this.modules.map((mod) => {
      return this.containerWhenModulesDown(...this.containerModuleDependents(mod)).pipe(
        switchMap(() => {
          const down$ = mod.moduleDown();

          if (down$ == null) {
            // Module down returned void, set state now.
            return this.containerModuleState(mod.moduleName, false, timeout);
          } else if (down$ instanceof Observable) {
            // Observable returned, update state on next.
            return down$.pipe(switchMap(() => this.containerModuleState(mod.moduleName, false, timeout)));
          } else {
            // Promise returned, update state on then.
            return from(down$).pipe(switchMap(() => this.containerModuleState(mod.moduleName, false, timeout)));
          }
        })
      );
    });
    return this.containerState(observables$, false);
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
  protected containerWhenModulesUp(...modules: string[]): Observable<void> {
    return this.modules$.pipe(
      filter((states) => {
        return modules.reduce((previous, current) => {
          return previous && states[current];
        }, true);
      }),
      map(() => undefined),
      take(1)
    );
  }

  /** Wait for modules to leave operational state before calling next. */
  protected containerWhenModulesDown(...modules: string[]): Observable<void> {
    return this.modules$.pipe(
      filter((states) => {
        return !modules.reduce((previous, current) => {
          return previous || states[current];
        }, false);
      }),
      map(() => undefined),
      take(1)
    );
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

  /** Update observable modules state for target module. */
  protected containerModuleState(name: string, state: boolean, timeout = 10000): Observable<void> {
    const next = { ...this.modules$.value, [name]: state };
    this.modules$.next(next);
    return of(undefined).pipe(
      rxjsTimeout(timeout),
      catchError((error) => {
        const errorName = state ? EContainerError.Up : EContainerError.Down;
        return throwError(new ContainerError(errorName, error, name));
      })
    );
  }

  /** Internal handler for `up` and `down` methods of class. */
  protected containerState(observables$: Array<Observable<void>>, state: boolean): Observable<void> {
    return forkJoin(...observables$).pipe(
      map(() => {
        const message = state ? EContainerLog.Up : EContainerLog.Down;
        this.sendLog(ELogLevel.Informational, message, { name: this.name }, []);
      })
    );
  }
}
