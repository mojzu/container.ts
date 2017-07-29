import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/map";
import {
  IContainerModuleOpts,
  IContainerModuleConstructor,
  ContainerModule,
} from "../container";
import { Validate } from "../lib/validate";
import { Script, ScriptProcess } from "./Script";
import { ChildProcess } from "./ChildProcess";

// TODO: Manager script options (restart limit, ...).

/** Manager script interface. */
export interface IManagerScript {
  name: string;
  uptimeLimit?: number;
}

export class ManagerFactory {

  /** Create manager classes for target scripts. */
  public static create(scripts: IManagerScript[]): IContainerModuleConstructor {
    class Manager extends ContainerModule {

      private _script: Script;
      private _workers: Array<ScriptProcess | null> = [];
      private _uptimes: Array<number | null> = [];
      private _unsubscribe = new Subject<void>();

      public get workers(): Array<ScriptProcess | null> { return this._workers; }
      public get uptimes(): Array<number | null> { return this._uptimes; }

      public constructor(name: string, opts: IContainerModuleOpts) {
        super(name, opts, { _script: Script.name });
      }

      public start(): void {
        scripts.map((script, index) => this.startWorker(script, index));
      }

      public stop(): void | Observable<void> {
        const observables: Array<Observable<any>> = [];
        this._unsubscribe.next();

        // Wait for worker processes to exit if connected.
        for (const worker of this._workers) {
          if ((worker != null) && worker.connected) {
            observables.push(worker.exit);
          }
        }

        if (observables.length > 0) {
          return Observable.forkJoin(...observables).map(() => undefined);
        }
      }

      protected startWorker(script: IManagerScript, index: number): void {
        const uptimeLimit = this.validUptimeLimit(script.uptimeLimit);
        const worker = this._script.fork(script.name);
        this._workers[index] = worker;

        // Handle process restarts.
        worker.exit
          .takeUntil(this._unsubscribe)
          .subscribe((code) => this.startWorker(script, index));

        // Track process uptime.
        worker.listen<number>(ChildProcess.EVENT.UPTIME)
          .takeUntil(this._unsubscribe)
          .subscribe((uptime) => {
            this.debug(`WORKER="${worker.target}" UPTIME="${uptime}"`);
            this._uptimes[index] = uptime;

            // Restart worker process if uptime limit exceeded.
            if ((uptimeLimit != null) && (uptime > uptimeLimit)) {
              this.debug(`WORKER="${worker.target}" RESTART`);
              worker.kill();
            }
          });
      }

      protected validUptimeLimit(limit?: number): number | null {
        if (limit != null) {
          const duration = Validate.isDuration(String(limit), { unit: "m" });
          return duration.asSeconds();
        }
        return null;
      }

    }
    return Manager;
  }

}
