import { IProcessOptions, Process } from "container.ts/lib/node-modules";
import * as constants from "../constants";

export class MainProcess extends Process {

  public static readonly NAME: string = "Main";

  public get options(): IProcessOptions {
    return {
      name: this.environment.get(constants.ENV_NAME) || "node",
      version: this.environment.get(constants.ENV_VERSION) || "0.0.0",
      nodeEnvironment: this.environment.get(constants.ENV_ENV) as any || "production",
    };
  }

}
