import * as os from "os";
import * as process from "process";
import { IModuleOptions, Module } from "../../../container";
import { ErrorChain } from "../../error";
import { isString } from "../validate";
import { Observable } from "./RxJS";

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
    NODE_ENV: "NODE_ENV",
  };

  /** Log names. */
  public static readonly LOG = {
    INFORMATION: "Process.Information",
    SIGNAL: "Process.Signal",
  };

  /** Metric names. */
  public static readonly METRIC = {
    USER_CPU_USAGE: "Process.UserCpuUsage",
    SYSTEM_CPU_USAGE: "Process.SystemCpuUsage",
    RSS_MEMORY_USAGE: "Process.RssMemoryUsage",
    HEAP_TOTAL_MEMORY_USAGE: "Process.HeapTotalMemoryUsage",
    HEAP_USED_MEMORY_USAGE: "Process.HeapUsedMemoryUsage",
  };

  /** Get Node.js process title. */
  public static get title(): string { return process.title; }

  /** Set Node.js process title. */
  public static setTitle(name?: string): string {
    if (name != null) {
      const untypedProcess: any = process;
      untypedProcess.title = name;
    }
    return process.title;
  }

  public get title(): string { return Process.title; }
  public readonly version = isString(this.environment.get(Process.ENV.VERSION, "1.0.0"));
  public readonly nodeEnv = isString(this.environment.get(Process.ENV.NODE_ENV, "production"));

  /** Override in subclass to change metric interval. */
  public get metricInterval(): number { return 60000; }

  /** Get Node.js process information. */
  public get information(): IProcessInformation {
    return {
      name: this.container.name,
      title: this.title,
      version: this.version,
      environment: this.nodeEnv,
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

  /** Get Node.js process status. */
  public get status(): IProcessStatus {
    return {
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
    };
  }

  public constructor(options: IModuleOptions) {
    super(options);

    // Set process title.
    Process.setTitle(isString(this.environment.get(Process.ENV.NAME, "node")));

    // Debug environment variables.
    this.debug(`${Process.ENV.NAME}="${this.title}"`);
    this.debug(`${Process.ENV.VERSION}="${this.version}"`);
    this.debug(`${Process.ENV.NODE_ENV}="${this.nodeEnv}"`);

    // Process metrics on interval.
    Observable.interval(this.metricInterval)
      .subscribe(() => this.processMetrics(this.status));
  }

  /** Try to read process information asset file, handle process events. */
  public moduleUp(): void {
    // Log process information.
    this.log.info(Process.LOG.INFORMATION, this.information);

    // Process end signal handlers.
    process.on("SIGTERM", () => this.processOnSignal("SIGTERM"));
    process.on("SIGINT", () => this.processOnSignal("SIGINT"));
  }

  /** Container down when process termination signal received. */
  protected processOnSignal(signal: string): void {
    this.log.info(Process.LOG.SIGNAL, { signal });
    this.container.down()
      .subscribe({
        next: () => {
          this.container.destroy();
          process.exit(0);
        },
        error: (error) => {
          // Write error to stderr and exit with error code.
          error = new ProcessError(error);
          process.stderr.write(`${error}\n`);
          this.container.destroy();
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
