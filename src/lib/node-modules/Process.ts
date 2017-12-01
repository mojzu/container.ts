import * as os from "os";
import * as process from "process";
import { IModuleOpts, Module } from "../../container";
import { Observable } from "../../container/RxJS";
import { ErrorChain } from "../error";
import { Validate } from "../validate";

/** Process runtime information interface. */
export interface IProcessInformation {
  name: string;
  title: string;
  version: string;
  environment: string;
  arch: string;
  platform: NodeJS.Platform;
  nodeVersion: string;
  pid: number;
  type: string;
  release: string;
  endianness: "BE" | "LE";
  hostname: string;
}

/** Process status interface. */
export interface IProcessStatus {
  uptime: number;
  cpuUsage: NodeJS.CpuUsage;
  memoryUsage: NodeJS.MemoryUsage;
}

/** Process error class. */
export class ProcessError extends ErrorChain {
  public constructor(cause?: Error) {
    super({ name: "ProcessError" }, cause);
  }
}

/** Node.js process interface. */
export class Process extends Module {

  /** Default module name. */
  public static readonly moduleName: string = "Process";

  /** Environment variable names. */
  public static readonly ENV = {
    NAME: "PROCESS_NAME",
    VERSION: "PROCESS_VERSION",
    NODE_ENV: "PROCESS_NODE_ENV",
  };

  /** Log names. */
  public static readonly LOG = {
    INFORMATION: "ProcessInformation",
    SIGNAL: "ProcessSignal",
  };

  /** Metric names. */
  public static readonly METRIC = {
    USER_CPU_USAGE: "ProcessUserCpuUsage",
    SYSTEM_CPU_USAGE: "ProcessSystemCpuUsage",
    RSS_MEMORY_USAGE: "ProcessRssMemoryUsage",
    HEAP_TOTAL_MEMORY_USAGE: "ProcessHeapTotalMemoryUsage",
    HEAP_USED_MEMORY_USAGE: "ProcessHeapUsedMemoryUsage",
  };

  /** Get Node.js process title. */
  public static get title(): string { return process.title; }

  /** Set Node.js process title. */
  public static setTitle(name?: string): string {
    if (name != null) {
      const untyped: any = process;
      untyped.title = name;
    }
    return process.title;
  }

  public get title(): string { return Process.title; }
  public readonly version = this.envVersion;
  public readonly nodeEnvironment = this.envNodeEnv;

  /** Override in subclass to change metric interval. */
  public get metricInterval(): number { return 60000; }

  public get information(): IProcessInformation {
    return {
      name: this.container.name,
      title: this.title,
      version: this.version,
      environment: this.nodeEnvironment,
      arch: process.arch,
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      type: os.type(),
      release: os.release(),
      endianness: os.endianness(),
      hostname: os.hostname(),
    };
  }

  public get status(): IProcessStatus {
    return {
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
    };
  }

  public constructor(opts: IModuleOpts) {
    super(opts);

    // Set process title.
    Process.setTitle(this.envName);

    // Debug environment variables.
    this.debug(`${Process.ENV.NAME}="${this.title}"`);
    this.debug(`${Process.ENV.VERSION}="${this.version}"`);
    this.debug(`${Process.ENV.NODE_ENV}="${this.nodeEnvironment}"`);

    // Process metrics on interval.
    Observable.interval(this.metricInterval)
      .subscribe(() => this.getProcessMetrics(this.status));
  }

  /** Try to read process information asset file, handle process events. */
  public moduleUp(): void {
    // Log process information.
    this.log.info(Process.LOG.INFORMATION, this.information);

    // Process end signal handlers.
    process.on("SIGTERM", this.onSignal.bind(this, "SIGTERM"));
    process.on("SIGINT", this.onSignal.bind(this, "SIGINT"));
  }

  protected get envName(): string {
    return Validate.isString(this.environment.get(Process.ENV.NAME) || "node");
  }

  protected get envVersion(): string {
    return Validate.isString(this.environment.get(Process.ENV.VERSION) || "1.0.0");
  }

  protected get envNodeEnv(): string {
    return Validate.isString(this.environment.get(Process.ENV.NODE_ENV) || "production");
  }

  /** Container down when process termination signal received. */
  protected onSignal(signal: string): void {
    this.log.info(Process.LOG.SIGNAL, { signal });
    this.container.down()
      .subscribe({
        next: () => process.exit(0),
        error: (error) => {
          // Try to log error and exit with error code.
          error = new ProcessError(error);
          this.log.error(error);
          process.stderr.write(`${error}\n`);
          process.exit(1);
        },
      });
  }

  protected getProcessMetrics(status: IProcessStatus): void {
    this.metric.gauge(Process.METRIC.USER_CPU_USAGE, status.cpuUsage.user);
    this.metric.gauge(Process.METRIC.SYSTEM_CPU_USAGE, status.cpuUsage.system);
    this.metric.gauge(Process.METRIC.RSS_MEMORY_USAGE, status.memoryUsage.rss);
    this.metric.gauge(Process.METRIC.HEAP_TOTAL_MEMORY_USAGE, status.memoryUsage.heapTotal);
    this.metric.gauge(Process.METRIC.HEAP_USED_MEMORY_USAGE, status.memoryUsage.heapUsed);
  }

}
