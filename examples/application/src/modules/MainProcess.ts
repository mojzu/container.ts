import { IProcessOptions, Process } from "container.ts/modules";

export class MainProcess extends Process {

  public static readonly NAME: string = "MainProcess";

  public get options(): IProcessOptions {
    // TODO: Get from assets file.
    return {
      name: "application",
      version: "0.0.0",
      nodeEnvironment: "development",
    };
  }

}
