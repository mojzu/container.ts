import { IModuleDependencies } from "container.ts";
import { Process, Scripts, ScriptsProcess } from "container.ts/lib/node-modules";
import { Observable } from "rxjs/Observable";

export class Main extends Process {

  public static readonly moduleName: string = "Main";

  public get moduleDependencies(): IModuleDependencies {
    return { scripts: Scripts };
  }

  public readonly scripts: Scripts;

  public readonly workerName = "Worker";
  public worker$: Observable<ScriptsProcess>;

  public moduleUp(): void {
    super.moduleUp();

    // Start worker process.
    this.worker$ = this.scripts.startWorker(this.workerName, "worker.js", {
      uptimeLimit: "PT5M", // Restart worker process every 5 minutes.
    });

    this.worker$.subscribe(() => {
      this.debug("worker started");
    });
  }

}
