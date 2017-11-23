import {
  AwilixContainer,
  createContainer,
  Lifetime,
  RegisterNameAndFunctionPair,
  ResolutionMode,
} from "awilix";
import { ErrorChain } from "../lib/error";
import { Environment } from "./Environment";
import { ELogLevel, ILogMessage, ILogMetadata } from "./Log";
import { EMetricType, IMetricTags } from "./Metric";
import { BehaviorSubject, Observable, Subject } from "./RxJS";
import { IModule, IModuleConstructor, IModuleOpts, IModuleState } from "./Types";

/** Command line arguments interface matching 'yargs' package. */
export interface IContainerArguments {
  /** Non-option arguments */
  _: string[];
  /** The script name or node command */
  $0: string;
  /** All remaining options */
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

/** Wrapper around awilix library. */
export class Container {

  /** Container reference name used internally by modules. */
  public static readonly REFERENCE = "_container";

  /** Error names. */
  public static readonly ERROR = {
    STATE: "ContainerStateError",
  };

  /** Log names. */
  public static readonly LOG = {
    UP: "ContainerUp",
    DOWN: "ContainerDown",
  };

  /** Root container. */
  public readonly container: AwilixContainer;

  /** Observable module state. */
  public readonly modules$ = new BehaviorSubject<IModuleState>({});

  /** Array of registered module names. */
  public get moduleNames(): string[] {
    return Object.keys(this.modules$.value);
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
    /** Container name, used to namespace modules. */
    public readonly name: string,
    /** Container environment. */
    public readonly environment = new Environment(),
    /** Optional command line arguments. */
    public readonly argv: IContainerArguments = { _: [], $0: "" },
  ) {
    this.environment = environment;
    this.container = createContainer({ resolutionMode: ResolutionMode.PROXY });
    this.registerValue<Container>(Container.REFERENCE, this);
  }

  /** Create scope from container. */
  public createScope(): AwilixContainer {
    return this.container.createScope();
  }

  /** Register a named module in container. */
  public registerModule<T extends IModuleConstructor>(
    name: string,
    instance: T,
  ): Container {
    const functionOptions: RegisterNameAndFunctionPair = {
      [name]: [this.moduleFactory.bind(this, name, instance), { lifetime: Lifetime.SINGLETON }],
    };
    this.container.registerFunction(functionOptions);
    this.moduleState(name, false);
    return this;
  }

  /** Register a value of type in container. */
  public registerValue<T>(name: string, value: T): Container {
    this.container.registerValue(name, value);
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

  /** Signal modules to enter operational state. */
  public up(timeout?: number): Observable<void> {
    const observables$ = this.modules
      .map((mod) => {
        return this.waitUp(...this.moduleDependencies(mod))
          .switchMap(() => {
            const up$ = mod.up();

            if (up$ == null) {
              // Module up returned void, set state now.
              return this.moduleState(mod.name, true);
            }
            // Observable returned, update state on next.
            return up$
              .switchMap(() => this.moduleState(mod.name, true));
          });
      });
    return this.containerState(observables$, false, timeout);
  }

  /** Signal modules to leave operational state. */
  public down(timeout?: number): Observable<void> {
    const observables$ = this.modules
      .map((mod) => {
        return this.waitDown(...this.moduleDependants(mod))
          .switchMap(() => {
            const down$ = mod.down();

            if (down$ == null) {
              // Module down returned void, set state now.
              return this.moduleState(mod.name, false);
            }
            // Observable returned, update state on next.
            return down$
              .switchMap(() => this.moduleState(mod.name, false));
          });
      });
    return this.containerState(observables$, false, timeout);
  }

  /** Wait for modules to enter operational state before calling next. */
  protected waitUp(...modules: string[]): Observable<void> {
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
  protected waitDown(...modules: string[]): Observable<void> {
    return this.modules$
      .filter((states) => {
        return !modules.reduce((previous, current) => {
          return previous || states[current];
        }, false);
      })
      .map(() => undefined)
      .take(1);
  }

  protected moduleFactory<T extends IModuleConstructor>(name: string, instance: T, opts: IModuleOpts): IModule {
    return new instance(name, opts);
  }

  protected moduleDependencies(mod: IModule): string[] {
    return Object.keys(mod.dependencies).map((k) => mod.dependencies[k]);
  }

  protected moduleDependants(mod: IModule): string[] {
    const dependants: string[] = [];
    this.modules.map((m) => {
      const dependant = Object.keys(m.dependencies).reduce((previous, key) => {
        return previous || (m.dependencies[key] === mod.name);
      }, false);

      if (dependant) {
        dependants.push(m.name);
      }
    });
    return dependants;
  }

  protected moduleState(name: string, state: boolean): Observable<void> {
    this.modules$.value[name] = state;
    this.modules$.next(this.modules$.value);
    return Observable.of(undefined);
  }

  protected containerState(observables$: Array<Observable<void>>, state: boolean, timeout = 10000): Observable<void> {
    return Observable.forkJoin(...observables$)
      .timeout(timeout)
      .catch((error) => Observable.throw(new ContainerError(Container.ERROR.STATE, error)))
      .map(() => {
        const message = state ? Container.LOG.UP : Container.LOG.DOWN;
        this.sendLog(ELogLevel.Informational, message, { name: this.name }, []);
      });
  }

}
