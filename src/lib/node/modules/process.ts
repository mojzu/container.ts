import * as os from "os";
import * as process from "process";
import { interval } from "rxjs";
import { IModuleOptions, Module } from "../../../container";
import { ErrorChain } from "../../error";
import { isString } from "../validate";

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

/** Process error codes. */
export enum EProcessError {
  Signal
}

/** Process error class. */
export class ProcessError extends ErrorChain {
  public constructor(code: EProcessError, cause?: Error, context?: object) {
    super({ name: "ProcessError", value: { code, ...context } }, cause);
  }
}

/** Process environment variable names. */
export enum EProcessEnv {
  Name = "PROCESS_NAME",
  Version = "PROCESS_VERSION",
  NodeEnv = "NODE_ENV"
}

/** Process log names. */
export enum EProcessLog {
  Information = "Process.Information",
  Signal = "Process.Signal"
}

/** Process metric names. */
export enum EProcessMetric {
  UserCpuUsage = "Process.UserCpuUsage",
  SystemCpuUsage = "Process.SystemCpuUsage",
  RssMemoryUsage = "Process.RssMemoryUsage",
  HeapTotalMemoryUsage = "Process.HeapTotalMemoryUsage",
  HeapUsedMemoryUsage = "Process.HeapUsedMemoryUsage"
}

/** Node.js process interface. */
export class Process extends Module {
  /** Default module name. */
  public static readonly moduleName: string = "Process";

  /** Get Node.js process title. */
  public static get title(): string {
    return process.title || "node";
  }

  /** Set Node.js process title. */
  public static setTitle(name?: string): string {
    if (name != null) {
      const untypedProcess: any = process;
      untypedProcess.title = name;
    }
    return Process.title;
  }

  public get envTitle(): string {
    return Process.title;
  }
  public readonly envVersion = isString(this.environment.get(EProcessEnv.Version, "1.0.0"));
  public readonly envNodeEnv = isString(this.environment.get(EProcessEnv.NodeEnv, "production"));

  /** Override in subclass to change metric interval. */
  public get metricInterval(): number {
    return 60000;
  }

  /** Get Node.js process information. */
  public get information(): IProcessInformation {
    return {
      name: this.container.name,
      title: this.envTitle,
      version: this.envVersion,
      environment: this.envNodeEnv,
      arch: process.arch,
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      type: os.type(),
      release: os.release(),
      endianness: os.endianness(),
      hostname: os.hostname()
    };
  }

  /** Get Node.js process status. */
  public get status(): IProcessStatus {
    return {
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage()
    };
  }

  public constructor(options: IModuleOptions) {
    super(options);

    // Set process title.
    Process.setTitle(isString(this.environment.get(EProcessEnv.Name, "node")));

    // Debug environment variables.
    this.debug(`${EProcessEnv.Name}="${this.envTitle}"`);
    this.debug(`${EProcessEnv.Version}="${this.envVersion}"`);
    this.debug(`${EProcessEnv.NodeEnv}="${this.envNodeEnv}"`);

    // Process metrics on interval.
    interval(this.metricInterval).subscribe(() => this.processMetrics(this.status));
  }

  /** Try to read process information asset file, handle process events. */
  public moduleUp(): void {
    // Log process information.
    this.log.info(EProcessLog.Information, this.information);

    // Process end signal handlers.
    process.on("SIGTERM", () => this.processOnSignal("SIGTERM"));
    process.on("SIGINT", () => this.processOnSignal("SIGINT"));
  }

  /** Container down when process termination signal received. */
  protected processOnSignal(signal: string): void {
    this.log.info(EProcessLog.Signal, { signal });
    this.container.down().subscribe({
      next: () => {
        this.container.destroy();
        process.exit(0);
      },
      error: (error) => {
        // Write error to stderr and exit with error code.
        error = new ProcessError(EProcessError.Signal, error, { signal });
        process.stderr.write(`${error}\n`);
        this.container.destroy();
        process.exit(1);
      }
    });
  }

  protected processMetrics(status: IProcessStatus): void {
    this.metric.gauge(EProcessMetric.UserCpuUsage, status.cpuUsage.user);
    this.metric.gauge(EProcessMetric.SystemCpuUsage, status.cpuUsage.system);
    this.metric.gauge(EProcessMetric.RssMemoryUsage, status.memoryUsage.rss);
    this.metric.gauge(EProcessMetric.HeapTotalMemoryUsage, status.memoryUsage.heapTotal);
    this.metric.gauge(EProcessMetric.HeapUsedMemoryUsage, status.memoryUsage.heapUsed);
  }
}
