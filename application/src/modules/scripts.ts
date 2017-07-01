/// <reference types="node" />
import * as path from "path";
import * as constants from "../constants";
import { IContainerOpts, ContainerModule } from "../container";
import { Environment } from "../environment";

export class Scripts extends ContainerModule {

  private _environment: Environment;
  private _path: string;

  public get path(): string { return this._path; }

  public constructor(opts: IContainerOpts) {
    super(opts, constants.SCRIPTS, {
      _environment: constants.ENVIRONMENT,
    });

    // Get scripts directory path from environment.
    this._path = path.resolve(this._environment.get(constants.ENV_SCRIPTS));
    this.debug(`path '${this.path}'`);
  }

}
