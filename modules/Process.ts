import * as process from "process";
import * as os from "os";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/interval";
import "rxjs/add/operator/switchMap";
import { ContainerModule } from "../container";
import { ErrorChain } from "../lib/error";

/** Process information interface. */
export interface IProcessOptions {
  name?: string;
  version?: string;
  nodeEnvironment?: "development" | "production";
}

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
export class Process extends ContainerModule {

  /** Default module name. */
  public static readonly NAME: string = "Process";

  /** Default interval to log process metrics (1m). */
  public static readonly DEFAULT_METRIC_INTERVAL = 60000;

  /** Log names. */
  public static readonly LOG = {
    INFORMATION: "ProcessInformation",
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

  private _version: string;
  private _nodeEnvironment: string;

  public get title(): string { return Process.title; }
  public get version(): string { return this._version; }
  public get nodeEnvironment(): string { return this._nodeEnvironment; }

  /** Override in subclass to set process title/version. */
  public get options(): IProcessOptions { return {}; }

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

  public setup(): void {
    // Set process title.
    Process.setTitle(this.options.name);
    this.debug(`TITLE="${this.title}"`);

    // Set process verion string.
    this._version = this.options.version || "0.0.0";
    this.debug(`VERSION="${this.version}"`);

    // Set process node environment.
    this._nodeEnvironment = this.options.nodeEnvironment || "production";
    this.debug(`NODE_ENV="${this.nodeEnvironment}"`);

    // Process metrics on interval.
    Observable.interval(Process.DEFAULT_METRIC_INTERVAL)
      .subscribe(() => this.processMetrics(this.status));
  }

  /** Try to read process information asset file, handle process events. */
  public start(): void {
    // Log process information.
    this.log.info(Process.LOG.INFORMATION, this.information);

    // Process stop event handlers.
    process.on("SIGTERM", this.handleStop.bind(this, "SIGTERM"));
    process.on("SIGINT", this.handleStop.bind(this, "SIGINT"));
  }

  /** Stop container when process termination event received. */
  protected handleStop(event: string): void {
    this.debug(`STOP="${event}"`);

    this.container.stop()
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

  protected processMetrics(status: IProcessStatus): void {
    this.metric.gauge(Process.METRIC.USER_CPU_USAGE, status.cpuUsage.user);
    this.metric.gauge(Process.METRIC.SYSTEM_CPU_USAGE, status.cpuUsage.system);
    this.metric.gauge(Process.METRIC.RSS_MEMORY_USAGE, status.memoryUsage.rss);
    this.metric.gauge(Process.METRIC.HEAP_TOTAL_MEMORY_USAGE, status.memoryUsage.heapTotal);
    this.metric.gauge(Process.METRIC.HEAP_USED_MEMORY_USAGE, status.memoryUsage.heapUsed);
  }

}
