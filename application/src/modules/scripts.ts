/// <reference types="node" />
import * as path from "path";
import * as fs from "fs";
import * as constants from "../constants";
import { IContainerOpts, ContainerModule, Environment } from "../container";

export class Scripts extends ContainerModule {

  private _environment: Environment;
  private _path: string;

  public get path(): string { return this._path; }

  public constructor(opts: IContainerOpts, name: string) {
    super(opts, name, { _environment: constants.ENVIRONMENT });

    // Get scripts directory path from environment.
    this._path = path.resolve(this._environment.get(constants.ENV_SCRIPTS));
    this.debug(`path '${this.path}'`);
    this.debug(`[${fs.readdirSync(this.path).join(", ")}]`);
  }

}
