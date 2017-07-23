import * as process from "process";
import * as path from "path";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/of";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/map";
import {
  Container,
  Environment,
  IContainerModuleOpts,
  ContainerModule,
} from "../container";
import {
  ENV_ASSET_PATH,
  Asset,
  Process,
  ENV_SCRIPT_PATH,
  Script,
  ScriptProcess,
  WinstonLog,
  ENV_STATSD_HOST,
  StatsdMetric,
} from "../modules";

// Define application container module.
export class Manager extends ContainerModule {

  private _script: Script;
  private _process: ScriptProcess;
  private _unsubscribe = new Subject<void>();

  public constructor(name: string, opts: IContainerModuleOpts) {
    // Depends on Script module.
    super(name, opts, { _script: Script.name });
  }

  public start(): Observable<void> {
    // Start server worker process.
    this.startServer();
    return Observable.of(undefined);
  }

  public stop(): Observable<void> {
    // Wait for server worker process to stop.
    this._unsubscribe.next();
    if (this._process.connected) {
      return this._process.exit.map(() => undefined);
    }
    return Observable.of(undefined);
  }

  public startServer(): void {
    // (Re)start server workor process.
    this._process = this._script.fork("server.js");
    this._process.exit
      .takeUntil(this._unsubscribe)
      .subscribe(() => {
        this.debug(`Worker process exit, restarting.`);
        this.startServer();
      });
  }

}

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env)
  .set(ENV_ASSET_PATH, path.resolve("./examples/assets"))
  .set(ENV_SCRIPT_PATH, path.resolve("./examples/scripts"))
  .set(ENV_STATSD_HOST, "localhost");

// Create container and register modules.
const CONTAINER = new Container("Main", ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(Process)
  .registerModule(Script)
  .registerModule(WinstonLog)
  .registerModule(StatsdMetric)
  .registerModule(Manager);

// Start modules.
CONTAINER.start()
  .subscribe({
    error: (error) => process.stderr.write(error),
  });
