import { asFunction, asValue, AwilixContainer, createContainer, InjectionMode } from "awilix";
import { keys } from "lodash";
import { ErrorChain } from "../lib/error";
import { Environment } from "./Environment";
import { ELogLevel, ILogMessage, ILogMetadata } from "./Log";
import { EMetricType, IMetricTags } from "./Metric";
import { BehaviorSubject, Observable, Subject } from "./RxJS";
import { IModule, IModuleConstructor, IModuleState } from "./Types";

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
  public constructor(name: string, cause?: Error) {
    super({ name }, cause);
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
    public level: ELogLevel,
    public message: ILogMessage,
    public metadata: ILogMetadata,
    public args: any[],
  ) { }
}

/** Container metric message interface. */
export interface IContainerMetricMessage {
  type: EMetricType;
  name: string;
  value: any;
  tags: IMetricTags;
}

/** Metric message class for stream of module metrics. */
export class ContainerMetricMessage implements IContainerMetricMessage {
  public constructor(
    public type: EMetricType,
    public name: string,
    public value: any,
    public tags: IMetricTags,
  ) { }
}

/**
 * Container class.
 * Wrapper around awilix library.
 */
export class Container {

  /** Error names. */
  public static readonly ERROR = {
    UP: "ContainerUpError",
    DOWN: "ContainerDownError",
    MODULE_REGISTERED: "ContainerModuleRegisteredError",
  };

  /** Log names. */
  public static readonly LOG = {
    UP: "ContainerUp",
    DOWN: "ContainerDown",
  };

  /** Scope key names. */
  public static readonly SCOPE = {
    /** Container reference name resolved internally by modules. */
    CONTAINER: "Container",
  };

  /** Root container. */
  public readonly container: AwilixContainer;

  /** Observable module state. */
  public readonly modules$ = new BehaviorSubject<IModuleState>({});

  /** Array of registered module names. */
  public get moduleNames(): string[] {
    return keys(this.modules$.value);
  }

  /** Array of registered modules. */
  public get modules(): IModule[] {
    return this.moduleNames.map((n) => this.container.resolve<IModule>(n));
  }

  /** Container module logs. */
  public readonly logs$ = new Subject<ContainerLogMessage>();

  /** Container module metrics. */
  public readonly metrics$ = new Subject<ContainerMetricMessage>();

  /** Creates a new container in proxy resolution mode. */
  public constructor(
    /** Required container name, used to namespace modules. */
    public readonly name: string,
    /** Optional container environment. */
    public readonly environment = new Environment(),
    /** Optional command line arguments. */
    public readonly argv: IContainerArguments = { _: [], $0: "" },
  ) {
    this.environment = environment;
    this.container = createContainer({ injectionMode: InjectionMode.PROXY });
    this.registerValue<Container>(Container.SCOPE.CONTAINER, this);
  }

  /** Create scoped container from root container. */
  public createScope(): AwilixContainer {
    return this.container.createScope();
  }

  /**
   * Register a module in container.
   * Throws an error if module of name is already registered.
   */
  public registerModule(moduleClass: IModuleConstructor): Container {
    if (this.containerModuleRegistered(moduleClass.moduleName)) {
      throw new ContainerError(Container.ERROR.MODULE_REGISTERED);
    }

    const factoryFunction = (opts: any) => this.containerModuleFactory(moduleClass, opts);
    this.container.register({ [moduleClass.moduleName]: asFunction(factoryFunction).singleton() });
    this.containerModuleState(moduleClass.moduleName, false);
    return this;
  }

  /** Register named modules in container. */
  public registerModules(modules: IModuleConstructor[]): Container {
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
  public sendMetric(type: EMetricType, name: string, value: any, tags: IMetricTags): void {
    this.metrics$.next(new ContainerMetricMessage(type, name, value, tags));
  }

  /** Observable stream of module logs filtered by level. */
  public filterLogs(level: ELogLevel): Observable<ContainerLogMessage> {
    return this.logs$.filter((m) => m.level <= level);
  }

  /** Observable stream of module metrics filtered by type. */
  public filterMetrics(type: EMetricType): Observable<ContainerMetricMessage> {
    return this.metrics$.filter((m) => m.type === type);
  }

  /**
   * Signal modules to enter operational state.
   * Module hook method `moduleUp` called in order of dependencies.
   */
  public up(timeout?: number): Observable<void> {
    const observables$ = this.modules
      .map((mod) => {
        return this.containerWhenModulesUp(...this.containerModuleDependencies(mod))
          .switchMap(() => {
            const up$ = mod.moduleUp();

            if (up$ == null) {
              // Module up returned void, set state now.
              return this.containerModuleState(mod.moduleName, true);
            }
            // Observable returned, update state on next.
            return up$
              .switchMap(() => this.containerModuleState(mod.moduleName, true));
          });
      });
    return this.containerState(observables$, true, timeout);
  }

  /**
   * Signal modules to leave operational state.
   * Module hook method `moduleDown` called in order of dependents.
   */
  public down(timeout?: number): Observable<void> {
    const observables$ = this.modules
      .map((mod) => {
        return this.containerWhenModulesDown(...this.containerModuleDependents(mod))
          .switchMap(() => {
            const down$ = mod.moduleDown();

            if (down$ == null) {
              // Module down returned void, set state now.
              return this.containerModuleState(mod.moduleName, false);
            }
            // Observable returned, update state on next.
            return down$
              .switchMap(() => this.containerModuleState(mod.moduleName, false));
          });
      });
    return this.containerState(observables$, false, timeout);
  }

  /** Wait for modules to enter operational state before calling next. */
  protected containerWhenModulesUp(...modules: string[]): Observable<void> {
    return this.modules$
      .filter((states) => {
        return modules.reduce((previous, current) => {
          return previous && states[current];
        }, true);
      })
      .map(() => undefined)
      .take(1);
  }

  /** Wait for modules to leave operational state before calling next. */
  protected containerWhenModulesDown(...modules: string[]): Observable<void> {
    return this.modules$
      .filter((states) => {
        return !modules.reduce((previous, current) => {
          return previous || states[current];
        }, false);
      })
      .map(() => undefined)
      .take(1);
  }

  /** Create a new instance of module class. */
  protected containerModuleFactory<T extends IModuleConstructor>(moduleClass: T, opts: any): IModule {
    return new moduleClass({ moduleName: moduleClass.moduleName, opts });
  }

  /** Returns list of module names which are dependencies of target module. */
  protected containerModuleDependencies(mod: IModule): string[] {
    const dependencies = mod.moduleDependencies();
    return keys(dependencies).map((k) => dependencies[k].moduleName);
  }

  /** Returns list of module names which are dependents of target module. */
  protected containerModuleDependents(mod: IModule): string[] {
    const dependents: string[] = [];
    this.modules.map((m) => {
      const dependencies = m.moduleDependencies();
      const dependent = keys(dependencies).reduce((previous, key) => {
        return previous || (dependencies[key].moduleName === mod.moduleName);
      }, false);

      if (dependent) {
        dependents.push(m.moduleName);
      }
    });
    return dependents;
  }

  /** Returns true if module is already registered in container. */
  protected containerModuleRegistered(name: string): boolean {
    return (this.modules$.value[name] != null);
  }

  /** Update observable modules state for target module. */
  protected containerModuleState(name: string, state: boolean): Observable<void> {
    const next = { ...this.modules$.value, [name]: state };
    this.modules$.next(next);
    return Observable.of(undefined);
  }

  /** Internal handler for `up` and `down` methods of class. */
  protected containerState(observables$: Array<Observable<void>>, state: boolean, timeout = 10000): Observable<void> {
    return Observable.forkJoin(...observables$)
      .timeout(timeout)
      .catch((error) => {
        const name = state ? Container.ERROR.UP : Container.ERROR.DOWN;
        return Observable.throw(new ContainerError(name, error));
      })
      .map(() => {
        const message = state ? Container.LOG.UP : Container.LOG.DOWN;
        this.sendLog(ELogLevel.Informational, message, { name: this.name }, []);
      });
  }

}
