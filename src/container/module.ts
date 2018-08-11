import * as Debug from "debug";
import { assign, keys } from "lodash";
import { Observable } from "rxjs";
import { ErrorChain } from "../lib/error";
import { Container, EContainerScope } from "./container";
import { Environment } from "./environment";
import { ELogLevel, ILogMessage, ILogMetadata, Log } from "./log";
import { EMetricType, IMetricTags, Metric } from "./metric";

/** Container options injected by awilix library. */
export interface IModuleOptions {
  moduleName: string;
  opts: any;
}

/** Module dependencies. */
export interface IModuleDependencies {
  [key: string]: typeof Module;
}

/** Module error codes. */
export enum EModuleError {
  Dependency
}

/** Module error class. */
export class ModuleError extends ErrorChain {
  public constructor(code: EModuleError, cause?: Error, context?: object) {
    super({ name: "ModuleError", value: { code, ...context } }, cause);
  }
}

/** Container module log class. */
export class ModuleLog extends Log {
  public constructor(protected readonly container: Container, protected readonly namespace: string) {
    super();
  }

  /**
   * Sends log message to container bus for consumption by modules.
   * Adds module namespace to metadata object by default.
   */
  protected log(level: ELogLevel, message: ILogMessage, metadata: ILogMetadata, ...args: any[]): void {
    metadata.moduleNamespace = this.namespace;
    this.container.sendLog(level, message, metadata, args);
  }
}

/** Container module metric class. */
export class ModuleMetric extends Metric {
  public constructor(protected readonly container: Container, protected readonly namespace: string) {
    super();
  }

  /**
   * Sends metric message to container bus for consumption by modules.
   * Adds module namespace to tags object by default.
   */
  protected metric(type: EMetricType, name: string, value: any, tags: IMetricTags, ...args: any[]): void {
    tags.moduleNamespace = this.namespace;
    this.container.sendMetric(type, name, value, tags, args);
  }
}

/** Base class for container class modules with dependency injection. */
export class Module {
  /** Default module name. */
  public static readonly moduleName: string = "Module";

  /** Module name. */
  public readonly moduleName: string;

  /** Module container reference. */
  public readonly container: Container;

  /** Module log interface. */
  public readonly log: ModuleLog;

  /** Module metric interface. */
  public readonly metric: ModuleMetric;

  /** Module debug interface. */
  public readonly debug: Debug.IDebugger;

  /** Module container environment reference. */
  public get environment(): Environment {
    return this.container.environment;
  }

  /** Module container and module names. */
  public get namespace(): string {
    return `${this.container.name}.${this.moduleName}`;
  }

  public constructor(options: IModuleOptions) {
    // Resolve container instance and construct instance properties.
    this.moduleName = options.moduleName;
    this.container = options.opts[EContainerScope.Container];
    this.log = new ModuleLog(this.container, this.namespace);
    this.metric = new ModuleMetric(this.container, this.namespace);
    this.debug = Debug(this.namespace);

    // Inject dependency values into instance.
    // Error is thrown by awilix if resolution failed.
    try {
      const dependencies = this.moduleDependencies();
      keys(dependencies).map((key) => {
        const target = dependencies[key];
        this[key] = options.opts[target.moduleName];
      });
    } catch (error) {
      throw new ModuleError(EModuleError.Dependency, error);
    }
  }

  /** Module dependencies hook. */
  public moduleDependencies(...previous: IModuleDependencies[]): IModuleDependencies {
    return assign({}, ...previous);
  }

  /** Module operational state hook. */
  public moduleUp(): void | Observable<void> | Promise<void> {}

  /** Module non-operational state hook. */
  public moduleDown(): void | Observable<void> | Promise<void> {}

  /** Module destruction hook. */
  public moduleDestroy(): void {}
}
