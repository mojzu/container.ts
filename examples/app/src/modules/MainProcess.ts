import { IModuleDependencies } from "container.ts";
import { IProcessOptions, Process, Scripts, ScriptsProcess } from "container.ts/lib/node-modules";
import { Observable } from "rxjs/Observable";
import * as constants from "../constants";

export class MainProcess extends Process {

  public static readonly NAME: string = "Main";

  public get dependencies(): IModuleDependencies {
    return { scripts: Scripts.NAME };
  }

  public readonly scripts: Scripts;

  public get options(): IProcessOptions {
    return {
      name: this.environment.get(constants.ENV_NAME),
      version: this.environment.get(constants.ENV_VERSION),
      nodeEnvironment: this.environment.get(constants.ENV_ENV),
    };
  }

  public readonly workerName = "Worker";
  public worker$: Observable<ScriptsProcess>;

  public start(): void {
    super.start();

    // Start worker process.
    this.worker$ = this.scripts.startWorker(this.workerName, "worker.js", {
      uptimeLimit: "PT5M", // Restart worker process every 5 minutes.
    });
  }

}
