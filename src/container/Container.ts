import {
  AwilixContainer,
  createContainer,
  Lifetime,
  RegisterNameAndFunctionPair,
  RegistrationOptions,
  ResolutionMode,
} from "awilix";
import "rxjs/add/observable/forkJoin";
import "rxjs/add/observable/of";
import "rxjs/add/observable/throw";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/do";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/take";
import "rxjs/add/operator/timeout";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { ErrorChain } from "../lib/error";
import { Environment } from "./Environment";
import { ELogLevel, ILogMessage, ILogMetadata } from "./Log";
import { EMetricType, IMetricTags } from "./Metric";
import { IModule, IModuleConstructor, IModuleOpts, IModuleState } from "./Types";

/** Command line arguments interface matching 'yargs'. */
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
    TIMEOUT: "ContainerTimeoutError",
  };

  /** Log names. */
  public static readonly LOG = {
    START: "ContainerStart",
    STOP: "ContainerStop",
  };

  public readonly container: AwilixContainer;

  public readonly modules$ = new BehaviorSubject<IModuleState>({});

  /** Array of registered module names. */
  public get moduleNames(): string[] { return Object.keys(this.modules$.value); }

  /** Container logs. */
  public readonly logs$ = new Subject<ContainerLogMessage>();

  /** Container metrics. */
  public readonly metrics$ = new Subject<ContainerMetricMessage>();

  /** Creates a new container in proxy resolution mode. */
  public constructor(
    public readonly name: string,
    public readonly environment = new Environment(),
    public readonly argv: IContainerArguments = { _: [], $0: "" },
  ) {
    this.environment = environment;
    this.container = createContainer({ resolutionMode: ResolutionMode.PROXY });
    this.registerValue<Container>(Container.REFERENCE, this);
  }

  /** Create scoped container. */
  public createScope(): AwilixContainer {
    return this.container.createScope();
  }

  /** Register a module in container, has singleton lifetime by default. */
  public registerModule<T extends IModuleConstructor>(
    name: string, instance: T,
    options: RegistrationOptions = { lifetime: Lifetime.SINGLETON },
  ): Container {
    const functionOptions: RegisterNameAndFunctionPair = {
      [name]: [this.makeModule.bind(this, name, instance), options],
    };
    this.container.registerFunction(functionOptions);
    this.reportModuleState(name, false);
    return this;
  }

  /** Register a value in container. */
  public registerValue<T>(name: string, value: T): Container {
    this.container.registerValue(name, value);
    return this;
  }

  /** Resolve module in container by name. */
  public resolve<T>(name: string): T {
    return this.container.resolve<T>(name);
  }

  /** Construct log metric name. */
  public logMeticName(level: ELogLevel): string {
    return `Log${ELogLevel[level]}`;
  }

  /** Send log message of level for module. */
  public sendLog(level: ELogLevel, message: ILogMessage, metadata: ILogMetadata, args: any[]): void {
    this.logs$.next(new ContainerLogMessage(level, message, metadata, args));
    this.sendMetric(EMetricType.Increment, this.logMeticName(level), 1, metadata);
  }

  /** Send metric message of type for module. */
  public sendMetric(type: EMetricType, name: string, value: any, tags: IMetricTags): void {
    this.metrics$.next(new ContainerMetricMessage(type, name, value, tags));
  }

  /** Observable stream of logs filtered by level. */
  public filterLogs(level: ELogLevel): Observable<ContainerLogMessage> {
    return this.logs$.filter((m) => m.level <= level);
  }

  /** Observable stream of metrics filtered by type. */
  public filterMetrics(type: EMetricType): Observable<ContainerMetricMessage> {
    return this.metrics$.filter((m) => m.type === type);
  }

  /** Signal modules to enter operational state. */
  public start(timeout?: number): Observable<void> {
    return this.setModuleStates(true, timeout);
  }

  /** Signal modules to leave operational state. */
  public stop(timeout?: number): Observable<void> {
    return this.setModuleStates(false, timeout);
  }

  /** Wait for modules to start before calling next. */
  public waitStarted(...modules: string[]): Observable<void> {
    return this.modules$
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
    return this.modules$
      .filter((states) => {
        return modules.reduce((previous, current) => {
          return previous || states[current];
        }, false);
      })
      .switchMap(() => Observable.of(undefined))
      .take(1);
  }

  /** Factory functions for modules. */
  protected makeModule<T extends IModuleConstructor>(
    name: string,
    instance: T,
    opts: IModuleOpts,
  ): IModule {
    return new instance(name, opts);
  }

  /** Set modules state by calling start/stop methods. */
  protected setModuleStates(state: boolean, timeout = 10000): Observable<void> {
    // Map module methods and report states.
    const modules = this.moduleNames.map((name) => this.container.resolve<IModule>(name));
    const observables$: Array<Observable<void>> = modules
      .map((mod) => {
        const method: () => void | Observable<void> = state ? mod.start.bind(mod) : mod.stop.bind(mod);
        const observable$ = method();

        if (observable$ == null) {
          // Module method has not returned observable, set state now.
          this.reportModuleState(mod.name, state);
          return null;
        } else {
          // Observable returned, update state on next.
          return observable$
            .do(() => this.reportModuleState(mod.name, state));
        }
      })
      // Filter to array of observables.
      .filter((o) => (o != null)) as any;

    // Nothing to wait for.
    if (observables$.length === 0) {
      return this.setModuleStatesDone(state);
    }

    // Wait for modules to signal state.
    // Map TimeoutError to ContainerError.
    return Observable.forkJoin(...observables$)
      .timeout(timeout)
      .catch((error: Error) => Observable.throw(new ContainerError(Container.ERROR.TIMEOUT, error)))
      .switchMap(() => this.setModuleStatesDone(state));
  }

  /** Update and report module state via internal subject. */
  protected reportModuleState(name: string, state: boolean): void {
    this.modules$.value[name] = state;
    this.modules$.next(this.modules$.value);
  }

  /** Module states are set. */
  protected setModuleStatesDone(state: boolean): Observable<void> {
    const message = state ? Container.LOG.START : Container.LOG.STOP;
    this.sendLog(ELogLevel.Informational, message, { name: this.name }, []);
    return Observable.of(undefined);
  }

}
