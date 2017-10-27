import * as Debug from "debug";
import { ErrorChain } from "../lib/error";
import { Container } from "./Container";
import { Environment } from "./Environment";
import { ELogLevel, ILogMessage, ILogMetadata, Log } from "./Log";
import { EMetricType, IMetricTags, Metric } from "./Metric";
import { Observable } from "./RxJS";
import { IModule, IModuleDependencies, IModuleOpts } from "./Types";

/** Module error class. */
export class ModuleError extends ErrorChain {
  public constructor(name: string, cause?: Error) {
    super({ name }, cause);
  }
}

/** Container module log class. */
export class ModuleLog extends Log {

  public constructor(
    protected readonly container: Container,
    protected readonly name: string,
  ) { super(); }

  /**
   * Sends log message to container bus for consumption by modules.
   * Adds module name to metadata object by default.
   */
  protected log(level: ELogLevel, message: ILogMessage, metadata: ILogMetadata, ...args: any[]): void {
    metadata.moduleName = this.name;
    this.container.sendLog(level, message, metadata, args);
  }

}

/** Container module metric class. */
export class ModuleMetric extends Metric {

  public constructor(
    protected readonly container: Container,
    protected readonly name: string,
  ) { super(); }

  /**
   * Sends metric message to container bus for consumption by modules.
   * Adds module name to tags object by default.
   */
  protected metric(type: EMetricType, name: string, value: any, tags: IMetricTags): void {
    tags.moduleName = this.name;
    this.container.sendMetric(type, name, value, tags);
  }

}

/** Base class for container class modules with dependency injection. */
export class Module implements IModule {

  /** Default module name. */
  public static readonly NAME: string = "Module";

  /** Error names. */
  public static readonly ERROR = {
    DEPENDENCY: "ModuleDependencyError",
  };

  /** Module container reference. */
  public readonly container: Container;

  /** Module name. */
  public readonly name: string;

  /** Module log interface. */
  public readonly log: ModuleLog;

  /** Module metric interface. */
  public readonly metric: ModuleMetric;

  /** Module debug interface. */
  public readonly debug: Debug.IDebugger;

  /** Module container environment reference. */
  public get environment(): Environment { return this.container.environment; }

  /** Module container and module names. */
  public get namespace(): string { return `${this.container.name}.${this.name}`; }

  /** Module dependencies hook, override if required. */
  public get dependencies(): IModuleDependencies { return {}; }

  public constructor(name: string, opts: IModuleOpts) {
    // Set name, resolve container instance and construct log, debug instances.
    this.name = name;
    this.container = opts[Container.REFERENCE];
    this.log = new ModuleLog(this.container, this.namespace);
    this.metric = new ModuleMetric(this.container, this.namespace);
    this.debug = Debug(this.namespace);

    // Inject dependency values into instance.
    // Error is thrown by awilix if resolution failed.
    try {
      Object.keys(this.dependencies).map((key) => {
        const target = this.dependencies[key];
        this[key] = opts[target];
      });
    } catch (error) {
      throw new ModuleError(Module.ERROR.DEPENDENCY, error);
    }
  }

  /** Module operational state. */
  public start(): void | Observable<void> { }

  /** Module non-operational state. */
  public stop(): void | Observable<void> { }

}
