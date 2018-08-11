import { ChildProcess as NodeChildProcess, fork } from "child_process";
import { keys } from "lodash";
import { resolve } from "path";
import { BehaviorSubject, Observable, of, Subject } from "rxjs";
import { filter, map, take, takeUntil } from "rxjs/operators";
import {
  IEnvironmentVariables,
  ILogMetadata,
  IModuleDependencies,
  IModuleDestroy,
  IModuleHook,
  IModuleOptions,
  RxModule
} from "../../../container";
import { ErrorChain } from "../../error/error-chain";
import { isDirectory, isFile } from "../validate";
import { Process } from "./process";

/** Scripts process options. */
export interface IScriptsForkOptions {
  args?: string[];
  env?: IEnvironmentVariables;
}

/** Scripts worker options. */
export interface IScriptsWorkerOptions extends IScriptsForkOptions {
  /** Worker process should restart after exit. */
  restart?: boolean;
  /** Worker process restarts maximum number of times. */
  restartLimit?: number;
  // TODO(M): Reimplement uptime limit support (ISO8601 duration).
}

/** Scripts worker. */
export interface IScriptsWorker {
  next$: BehaviorSubject<ScriptsProcess>;
  unsubscribe$: Subject<void>;
  restarts: number;
}

/** Scripts process exit event. */
export interface IScriptsProcessExit {
  pid: number;
  code?: number;
  signal?: string;
}

/** Scripts process error event. */
export interface IScriptsProcessError {
  pid: number;
  error: any;
}

/** ScriptsProcess error codes. */
export enum EScriptsProcessError {
  Exit,
  Error
}

/** ScriptsProcess error class. */
export class ScriptsProcessError extends ErrorChain {
  public constructor(code: EScriptsProcessError, cause?: Error, context?: object) {
    super({ name: "ScriptsProcessError", value: { code, ...context } }, cause);
  }
}

/** Spawned scripts process. */
export class ScriptsProcess {
  public readonly exit$: Observable<number | string>;

  public constructor(
    public readonly scripts: Scripts,
    public readonly fileName: string,
    public readonly process: NodeChildProcess
  ) {
    // Connect process events to subjects.
    this.process.on("exit", (code?: number, signal?: string) => {
      this.scripts.processExit$.next({ pid: this.process.pid, code, signal });
    });
    this.process.on("error", (error: any) => {
      this.scripts.processError$.next({ pid: this.process.pid, error });
    });

    // Create exit observable, reduce code/signal argument.
    this.exit$ = this.scripts.rxTakeUntilModuleDown(this.scripts.processExit$).pipe(
      filter((exit) => exit.pid === this.process.pid),
      take(1),
      map((exit) => {
        const code = exit.code != null ? exit.code : exit.signal;
        return code != null ? code : 1;
      })
    );

    // Subscribe to exit observable to log errors.
    this.exit$.subscribe((code) => {
      if (code !== 0) {
        const error = new ScriptsProcessError(EScriptsProcessError.Exit, undefined, { code, fileName: this.fileName });
        this.scripts.log.error(error, { code });
      }
    });

    // Subscribe to error observable to forward to scripts logger.
    this.scripts
      .rxTakeUntilModuleDown(this.scripts.processError$)
      .pipe(
        takeUntil(this.exit$),
        filter((exit) => exit.pid === this.process.pid)
      )
      .subscribe((error) => {
        const chained = new ScriptsProcessError(EScriptsProcessError.Error, error.error, { fileName: this.fileName });
        this.scripts.log.error(chained);
      });
  }

  /** End child process with signal. */
  public kill(signal?: string): Observable<number | string> {
    this.process.kill(signal);
    return this.exit$;
  }
}

/** Scripts environment variable names. */
export enum EScriptsEnv {
  /** Scripts directory path (required). */
  Path = "SCRIPTS_PATH"
}

/** Scripts log names. */
export enum EScriptsLog {
  WorkerStart = "Scripts.WorkerStart",
  WorkerStop = "Scripts.WorkerStop",
  WorkerExit = "Scripts.WorkerExit",
  WorkerRestart = "Scripts.WorkerRestart",
  WorkerRestartLimit = "Scripts.WorkerRestartLimit"
}

/** Node.js scripts module. */
export class Scripts extends RxModule {
  /** Default module name. */
  public static readonly moduleName: string = "Scripts";

  /** Absolute path to script files directory. */
  public readonly envPath = isDirectory(this.environment.get(EScriptsEnv.Path));

  /** Observable stream of process exit events. */
  public readonly processExit$ = new Subject<IScriptsProcessExit>();

  /** Observable stream of process error events. */
  public readonly processError$ = new Subject<IScriptsProcessError>();

  /** Workers state. */
  protected readonly scriptsWorkers: { [name: string]: IScriptsWorker } = {};

  /** Process module dependency. */
  protected readonly process!: Process;

  public constructor(options: IModuleOptions) {
    super(options);
    this.debug(`${EScriptsEnv.Path}="${this.envPath}"`);
  }

  public moduleDependencies(...previous: IModuleDependencies[]) {
    return super.moduleDependencies(...previous, { process: Process });
  }

  public moduleDown(...args: IModuleHook[]) {
    // Wait for worker processes to exit.
    return super.moduleDown(...args, async () => {
      const promises = keys(this.scriptsWorkers).map((name) => {
        return this.stopWorker(name).toPromise();
      });
      await Promise.all(promises);
    });
  }

  public moduleDestroy(...args: IModuleDestroy[]) {
    return super.moduleDestroy(...args, () => {
      this.processExit$.complete();
      this.processError$.complete();
    });
  }

  /** Spawn new Node.js process using script file. */
  public fork(fileName: string, options: IScriptsForkOptions = {}): ScriptsProcess {
    const forkEnv = this.environment.copy(options.env || {});

    // Check script file exists and fork.
    const filePath = isFile(resolve(this.envPath, fileName));
    const process = fork(filePath, options.args || [], { env: forkEnv.variables });
    return new ScriptsProcess(this, fileName, process);
  }

  public startWorker(name: string, fileName: string, options: IScriptsWorkerOptions = {}): Observable<ScriptsProcess> {
    const process = this.fork(fileName, options);

    if (this.scriptsWorkers[name] == null) {
      // New worker, create new observables.
      const next$ = new BehaviorSubject<ScriptsProcess>(process);
      const unsubscribe$ = new Subject<void>();
      this.scriptsWorkers[name] = { next$, unsubscribe$, restarts: 0 };

      // Log worker start.
      const metadata = this.scriptsWorkerLogMetadata({ name, worker: this.scriptsWorkers[name], options });
      this.log.info(EScriptsLog.WorkerStart, metadata);
    } else {
      // Restarted worker, update process in state.
      this.scriptsWorkers[name].unsubscribe$.next();
      this.scriptsWorkers[name].next$.next(process);
      this.scriptsWorkers[name].restarts += 1;
    }
    const worker = this.scriptsWorkers[name];

    // Handle worker restarts.
    process.exit$.pipe(takeUntil(worker.unsubscribe$)).subscribe((code) => {
      // Log worker exit.
      const metadata = this.scriptsWorkerLogMetadata({ name, worker, code });
      this.log.info(EScriptsLog.WorkerExit, metadata);

      // Restart worker process by default.
      if (options.restart == null || !!options.restart) {
        // Do not restart process if limit reached.
        if (options.restartLimit == null || worker.restarts < options.restartLimit) {
          this.log.info(EScriptsLog.WorkerRestart, metadata);
          this.startWorker(name, fileName, options);
        } else {
          this.log.error(EScriptsLog.WorkerRestartLimit, metadata);
          this.stopWorker(name);
        }
      }
    });

    return worker.next$;
  }

  public stopWorker(name: string): Observable<string | number> {
    const worker = this.scriptsWorkers[name];
    let observable$: Observable<string | number> = of(0);

    if (worker != null) {
      const process = worker.next$.value;

      // Observables clean up.
      worker.unsubscribe$.next();
      worker.unsubscribe$.complete();
      worker.next$.complete();

      // End process if connected.
      if (process.process.connected) {
        observable$ = process.kill();
      }

      // Log worker stop and delete in state.
      const metadata = this.scriptsWorkerLogMetadata({ name, worker });
      this.log.info(EScriptsLog.WorkerStop, metadata);
      delete this.scriptsWorkers[name];
    }

    return observable$;
  }

  protected scriptsWorkerLogMetadata(data: {
    name: string;
    worker: IScriptsWorker;
    options?: IScriptsWorkerOptions;
    code?: string | number;
  }): ILogMetadata {
    const metadata: ILogMetadata = {
      name: data.name,
      restarts: data.worker.restarts
    };
    if (data.options != null) {
      metadata.restart = data.options.restart;
      metadata.restartLimit = data.options.restartLimit;
    }
    if (data.code != null) {
      metadata.code = data.code;
    }
    return metadata;
  }
}
