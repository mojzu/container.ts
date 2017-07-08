/// <reference types="node" />
import * as process from "process";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
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
    super(name, opts, { _assets: constants.ASSETS });

    // Default unknown version value.
    this._version = "0.0.0-unknown";
  }

  /** Read process information assets file. */
  public start(): Observable<void> {
    return this.container.waitStarted(constants.ASSETS)
      .switchMap(() => this._assets.readJson(constants.ASSET_PROCESS_JSON))
      .switchMap((data: IProcess) => {

        // Set process title.
        Process.setTitle(data.name);
        this.debug(`title '${this.title}'`);

        // Read process verion string.
        this._version = data.version || this._version;
        this.debug(`version '${this.version}'`);

        return Observable.of(undefined);
      });
  }

}
