/// <reference types="node" />
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/of";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/map";
import { IContainerModuleOpts, ContainerModule } from "../../container";
import { Script, ScriptProcess, ChildProcess } from "../../modules";

// Define application container module.
export class Manager extends ContainerModule {

  private _script: Script;
  private _serverProcess: ScriptProcess;
  private _socketProcess: ScriptProcess;
  private _unsubscribe = new Subject<void>();

  public constructor(name: string, opts: IContainerModuleOpts) {
    // Depends on Script module.
    super(name, opts, { _script: Script.name });
  }

  public start(): void {
    // Start server/socket worker processes.
    this.startServerWorker();
    this.startSocketWorker();
  }

  public stop(): void | Observable<void> {
    // Wait for worker processes to stop.
    const observables: any[] = [];
    this._unsubscribe.next();

    if (this._serverProcess.connected) {
      observables.push(this._serverProcess.exit);
    }
    if (this._socketProcess.connected) {
      observables.push(this._socketProcess.exit);
    }

    if (observables.length > 0) {
      return Observable.forkJoin(...observables).map(() => undefined);
    }
  }

  public startServerWorker(): void {
    // (Re)start server workor process.
    this._serverProcess = this._script.fork("server.js");
    this._serverProcess.exit
      .takeUntil(this._unsubscribe)
      .subscribe(() => {
        this.debug(`Server worker process exit, restarting.`);
        this.startServerWorker();
      });
    this._serverProcess.listen<number>(ChildProcess.EVENTS.UPTIME)
      .takeUntil(this._unsubscribe)
      .subscribe((uptime) => {
        this.debug(`Server worker uptime: ${uptime}`);
      });
  }

  public startSocketWorker(): void {
    // (Re)start socket workor process.
    this._socketProcess = this._script.fork("socket.js");
    this._socketProcess.exit
      .takeUntil(this._unsubscribe)
      .subscribe(() => {
        this.debug(`Socket worker process exit, restarting.`);
        this.startSocketWorker();
      });
    this._socketProcess.listen<number>(ChildProcess.EVENTS.UPTIME)
      .takeUntil(this._unsubscribe)
      .subscribe((uptime) => {
        this.debug(`Socket worker uptime: ${uptime}`);
      });
  }

}
