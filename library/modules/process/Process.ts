/// <reference types="node" />
import * as process from "process";
import * as os from "os";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/operator/switchMap";
import { IContainerModuleOpts, ContainerModule } from "../../container";
import { Asset } from "../asset/Asset";

/** Process information interface. */
export interface IProcess {
  name?: string;
  version?: string;
}

/** Process runtime information interface. */
export interface IProcessInformation {
  title: string;
  version: string;
  arch: string;
  platform: string;
  nodeVersion: string;
  pid: number;
  type: string;
  release: string;
  endianness: string;
  hostname: string;
}

/** Process information asset file name. */
export const ASSET_PROCESS_JSON = "process.json";

/** Node.js process interface. */
export class Process extends ContainerModule {

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
  public get version(): string { return this._version; }

  public get nodeEnvironment(): string {
    // TODO: Support `NODE_ENV` in environment.
    const parts = this.version.split("-");
    return parts[1] || "production";
  }

  public get information(): IProcessInformation {
    return {
      title: this.title,
      version: this.version,
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

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts, { _asset: Asset.name });

    // Default production version value.
    this._version = "0.0.0-production";
  }

  /** Try to read process information asset file, handle process events. */
  public start(): Observable<void> {
    return this.container.waitStarted(Asset.name)
      .switchMap(() => this._asset.readJson(ASSET_PROCESS_JSON))
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

        // Log process information.
        this.log.info("ProcessInformation", this.information);

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

}
