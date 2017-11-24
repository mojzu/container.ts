import { IModuleDependencies } from "container.ts";
import { Process, Scripts, ScriptsProcess } from "container.ts/lib/node-modules";
import { Observable } from "rxjs/Observable";

export class Main extends Process {

  public static readonly NAME: string = "Main";

  public get dependencies(): IModuleDependencies {
    return { scripts: Scripts.NAME };
  }

  public readonly scripts: Scripts;

  public readonly workerName = "Worker";
  public worker$: Observable<ScriptsProcess>;

  public up(): void {
    super.up();

    // Start worker process.
    this.worker$ = this.scripts.startWorker(this.workerName, "worker.js", {
      uptimeLimit: "PT5M", // Restart worker process every 5 minutes.
    });

    this.worker$.subscribe(() => {
      this.debug("worker started");
    });
  }

}
