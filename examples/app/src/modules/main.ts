import { IModuleDependencies, Module } from "container.ts";
import { Scripts, ScriptsProcess } from "container.ts/lib/node/modules";
import { Observable } from "rxjs";

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
    this.worker$ = this.scripts.startWorker(this.workerName, "worker.js");

    this.worker$.subscribe(() => {
      this.debug("worker started");
    });
  }
}
