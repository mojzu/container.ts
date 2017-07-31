/// <reference types="node" />
import * as process from "process";
import * as os from "os";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/interval";
import "rxjs/add/operator/switchMap";
import { IContainerModuleOpts, ContainerModule } from "../container";
import { Asset } from "./Asset";

/** Process information interface. */
export interface IProcess {
  name?: string;
  version?: string;
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

/** Node.js process interface. */
export class Process extends ContainerModule {

  /** Default interval to log process metrics (1m). */
  public static DEFAULT_METRIC_INTERVAL = 60000;

  /** Asset file names. */
  public static ASSET = {
    /** Process information asset file. */
    PROCESS_JSON: "process.json",
  };

  /** Log names. */
  public static LOG = {
    INFORMATION: "ProcessInformation",
  };

  /** Metric names. */
  public static METRIC = {
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

  private _asset: Asset;
  private _version: string;

  public get title(): string { return Process.title; }

  public get version(): string {
    const parts = this._version.split("-");
    return parts[0] || "0.0.0";
  }

  public get nodeEnvironment(): string {
    const parts = this._version.split("-");
    return parts[1] || "production";
  }

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

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts, { _asset: Asset.name });

    // Default production version value.
    this._version = "0.0.0-production";

    // Process metrics on interval.
    Observable.interval(Process.DEFAULT_METRIC_INTERVAL)
      .subscribe(() => this.processMetrics(this.status));
  }

  /** Try to read process information asset file, handle process events. */
  public start(): Observable<void> {
    return this.container.waitStarted(Asset.name)
      .switchMap(() => this._asset.readJson(Process.ASSET.PROCESS_JSON))
      .catch((error) => {
        // Handle error to read process information file.
        this.log.error(error);
        return Observable.of({});
      })
      .switchMap((data: IProcess) => {

        // Set process title.
        Process.setTitle(data.name);
        this.debug(`TITLE="${this.title}"`);

        // Read process verion string.
        this._version = data.version || this._version;
        this.debug(`VERSION="${this.version}"`);
        this.debug(`ENVIRONMENT="${this.nodeEnvironment}"`);

        // Log process information.
        this.log.info(Process.LOG.INFORMATION, this.information);

        // Process stop event handlers.
        process.on("SIGTERM", this.handleStop.bind(this, "SIGTERM"));
        process.on("SIGINT", this.handleStop.bind(this, "SIGINT"));

        return Observable.of(undefined);
      });
  }

  /** Stop container when process termination event received. */
  protected handleStop(event: string): void {
    this.debug(`STOP="${event}"`);

    this.container.stop()
      .subscribe({
        next: () => process.exit(0),
        error: (error) => {
          // Try to log error and exit with error code.
          this.log.error(error);
          process.stderr.write(String(error));
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
