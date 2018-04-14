import { IModuleDependencies, Module } from "container.ts";
import { Scripts, ScriptsProcess } from "container.ts/lib/node/modules";
import { Observable } from "rxjs/Observable";

export class Main extends Module {

  public static readonly moduleName: string = "Main";

  public readonly scripts!: Scripts;

  public readonly workerName = "Worker";
  public worker$?: Observable<ScriptsProcess>;

  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { scripts: Scripts });
  }

  public moduleUp(): void {
    // Start worker process.
    this.worker$ = this.scripts.startWorker(this.workerName, "worker.js", {
      uptimeLimit: "PT5M", // Restart worker process every 5 minutes.
    });

    this.worker$.subscribe(() => {
      this.debug("worker started");
    });
  }

}
