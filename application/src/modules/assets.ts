/// <reference types="node" />
import * as path from "path";
import * as fs from "fs";
import * as constants from "../constants";
import { IContainerOpts, ContainerModule } from "../container";

export class Assets extends ContainerModule {

  private _path: string;

  public get path(): string { return this._path; }

  public constructor(opts: IContainerOpts, name: string) {
    super(opts, name);

    // Get assets directory path from environment.
    this._path = path.resolve(this.environment.get(constants.ENV_ASSETS));
    this.debug(`path '${this.path}'`);
    this.debug(`[${fs.readdirSync(this.path).join(", ")}]`);
  }

}
