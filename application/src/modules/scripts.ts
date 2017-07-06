/// <reference types="node" />
import * as path from "path";
import * as fs from "fs";
import * as constants from "../constants";
import { IContainerModuleOpts, ContainerModule } from "../container";

export class Scripts extends ContainerModule {

  private _path: string;

  public get path(): string { return this._path; }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get scripts directory path from environment.
    this._path = path.resolve(this.environment.get(constants.ENV_SCRIPTS));
    this.debug(`path '${this.path}'`);
    this.debug(`[${fs.readdirSync(this.path).join(", ")}]`);
  }

}
