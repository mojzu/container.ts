import { ChildProcess, IProcessOptions } from "container.ts/lib/node-modules";
import * as constants from "../constants";

export class ServerProcess extends ChildProcess {

  public static readonly NAME: string = "Server";

  public get options(): IProcessOptions {
    return {
      name: this.environment.get(ChildProcess.ENV.NAME) || "node",
      version: this.environment.get(constants.ENV_VERSION) || "0.0.0",
      nodeEnvironment: this.environment.get(constants.ENV_ENV) as any || "production",
    };
  }

}
