/// <reference types="node" />
import * as path from "path";
import * as constants from "../constants";
import { IContainerOpts, ContainerModule } from "../container";
import { Environment } from "../environment";

export class Assets extends ContainerModule {

  private _environment: Environment;
  private _path: string;

  public get path(): string { return this._path; }

  public constructor(opts: IContainerOpts) {
    super(opts, constants.ASSETS, {
      _environment: constants.ENVIRONMENT,
    });

    // Get assets directory path from environment.
    this._path = path.resolve(this._environment.get(constants.ENV_ASSETS));
    this.debug(`path '${this.path}'`);
  }

}
