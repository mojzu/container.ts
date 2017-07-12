/// <reference types="node" />
import * as process from "process";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/operator/switchMap";
import * as constants from "../../constants";
import { IContainerModuleOpts, ContainerModule } from "../../container";
import { Assets } from "../assets";

/** Process information interface. */
export interface IProcess {
  name?: string;
  version?: string;
}

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

  private _assets: Assets;
  private _version: string;

  public get title(): string { return Process.title; }
  public get version(): string { return this._version; }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts, { _assets: Assets.name });

    // Default unknown version value.
    this._version = "0.0.0-unknown";
  }

  /** Read process information assets file, handle process events. */
  public start(): Observable<void> {
    return this.container.waitStarted(Assets.name)
      .switchMap(() => this._assets.readJson(constants.ASSET_PROCESS_JSON))
      .switchMap((data: IProcess) => {

        // Set process title.
        Process.setTitle(data.name);
        this.debug(`title '${this.title}'`);

        // Read process verion string.
        this._version = data.version || this._version;
        this.debug(`version '${this.version}'`);

        // Process stop event handlers.
        process.on("SIGTERM", this.handleStop.bind(this, "SIGTERM"));
        process.on("SIGINT", this.handleStop.bind(this, "SIGINT"));

        return Observable.of(undefined);
      });
  }

  /** Stop container when process termination event received. */
  protected handleStop(event: string): void {
    this.debug(`stop '${event}'`);

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
