import { ChildProcess, IProcessOptions } from "container.ts/lib/node-modules";
import * as constants from "../constants";

export class WorkerProcess extends ChildProcess {

  public static readonly NAME: string = "Worker";

  public get options(): IProcessOptions {
    return {
      name: this.environment.get(constants.ENV_NAME),
      version: this.environment.get(constants.ENV_VERSION),
      nodeEnvironment: this.environment.get(constants.ENV_ENV),
    };
  }

}
