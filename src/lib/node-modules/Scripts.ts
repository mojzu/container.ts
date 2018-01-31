import { ChildProcess as NodeChildProcess, fork } from "child_process";
import * as Debug from "debug";
import { keys } from "lodash";
import { Socket } from "net";
import * as ipc from "node-ipc";
import { resolve } from "path";
import {
  IContainerLogMessage,
  IContainerMetricMessage,
  IEnvironmentVariables,
  ILogMetadata,
  IModuleDependencies,
  IModuleOptions,
  Module,
} from "../../container";
import { ErrorChain } from "../error";
import { isDirectory, isDuration, isFile } from "../node-validate";
import { ChildProcess } from "./ChildProcess";
import { IProcessStatus, Process } from "./Process";
import { BehaviorSubject, Observable, Subject } from "./RxJS";
import {
  EProcessMessageType,
  IProcessCallOptions,
  IProcessEvent,
  IProcessEventOptions,
  IProcessExit,
  IProcessMessage,
  IProcessMessageData,
  IProcessSend,
} from "./Types";

/** Scripts process options. */
export interface IScriptsOptions {
  args?: string[];
  env?: IEnvironmentVariables;
}

/** Scripts worker options. */
export interface IScriptsWorkerOptions extends IScriptsOptions {
  /** Disable IPC for this worker if not required. */
  disableIpc?: boolean;
  /** Worker process should restart after exit. */
  restart?: boolean;
  /** Worker process restarts maximum number of times. */
  restartLimit?: number;
  /** Maximum script uptime as ISO8601 duration. */
  uptimeLimit?: string;
}

/** Scripts worker. */
export interface IScriptsWorker {
  next$: BehaviorSubject<ScriptsProcess>;
  unsubscribe$: Subject<void>;
  restarts: number;
}

/** Scripts IPC message. */
export interface IScriptsIpcMessage {
  socket: Socket;
  data: any;
}

/** Scripts error class. */
export class ScriptsError extends ErrorChain {
  public constructor(cause?: Error) {
    super({ name: "ScriptsError" }, cause);
  }
}

/** ScriptsProcess error class. */
export class ScriptsProcessError extends ErrorChain {
  public constructor(fileName: string, cause?: Error) {
    super({ name: "ScriptsProcessError", value: fileName }, cause);
  }
}

/** Spawned scripts process. */
export class ScriptsProcess implements IProcessSend {

  /** IPC socket set if acquired. */
  public ipcSocket?: Socket;

  public readonly exit$: Observable<number | string>;
  public readonly messages$ = new Subject<IProcessMessage<any>>();
  public readonly events$ = new Subject<IProcessEvent<any>>();

  public get isConnected(): boolean { return this.process.connected; }

  public constructor(
    public readonly scripts: Scripts,
    public readonly fileName: string,
    public readonly process: NodeChildProcess,
  ) {
    // Accumulate multiple callback arguments into array.
    const accumulator: () => IProcessExit = (...args: any[]) => args as any;

    // Listen for process exit, reduce code/signal for next argument.
    this.exit$ = Observable.fromEvent<IProcessExit>(process as any, "exit", accumulator)
      .take(1)
      .map((args) => {
        const [code, signal] = args;
        const value = (typeof code === "number") ? code : signal;
        return (value != null) ? value : 1;
      });

    // Log error if script exits with error code.
    this.exit$.subscribe((code) => {
      if (code !== 0) {
        const error = new ScriptsProcessError(this.fileName);
        this.scripts.log.error(error);
      }
    });

    // Listen for process error, forward to scripts logger.
    Observable.fromEvent<Error>(process as any, "error")
      .takeUntil(this.exit$)
      .subscribe((error) => {
        const chained = new ScriptsProcessError(this.fileName, error);
        this.scripts.log.error(chained);
      });

    // Handle IPC messages from scripts module.
    this.scripts.ipcMessages$
      .takeUntil(this.exit$)
      .filter((message) => message.socket === this.ipcSocket)
      .subscribe((message) => {
        this.messages$.next(message.data);
      });
    this.messages$
      .takeUntil(this.exit$)
      .subscribe((message) => this.scriptsProcessOnMessage(message));
  }

  /** End child process with signal. */
  public kill(signal?: string): Observable<number | string> {
    this.process.kill(signal);
    return this.exit$;
  }

  /** Send message via IPC. */
  public send<T>(type: EProcessMessageType, data: IProcessMessageData<T>): void {
    if ((this.ipcSocket != null) && this.ipcSocket.writable) {
      const message: IProcessMessage<T> = { type, data };
      ipc.server.emit(this.ipcSocket, "message", message);
    }
  }

  /** Send event to child process. */
  public event<T>(name: string, options: IProcessEventOptions<T> = {}): void {
    ChildProcess.ipcSendEvent<T>(this, this.scripts, name, options);
  }

  /** Listen for event sent by child process. */
  public listen<T>(name: string): Observable<T> {
    return ChildProcess.ipcListenForEvent<T>(this.events$, name);
  }

  /** Make call to module.method in child process. */
  public call<T>(target: string, method: string, options: IProcessCallOptions = {}): Observable<T> {
    return ChildProcess.ipcSendCallRequest<T>(this, this.scripts, target, method, options);
  }

  /** Handle received messages. */
  protected scriptsProcessOnMessage(message: IProcessMessage<any>): void {
    switch (message.type) {
      // Send received log and metric messages to container.
      case EProcessMessageType.Log: {
        const data: IContainerLogMessage = message.data;
        this.scripts.container.sendLog(data.level, data.message, data.metadata, data.args);
        break;
      }
      case EProcessMessageType.Metric: {
        const data: IContainerMetricMessage = message.data;
        this.scripts.container.sendMetric(data.type, data.name, data.value, data.tags, data.args);
        break;
      }
      // Send event on internal event bus.
      case EProcessMessageType.Event: {
        const event: IProcessEvent<any> = message.data;
        this.events$.next(event);
        break;
      }
      // Call request received from child.
      case EProcessMessageType.CallRequest: {
        ChildProcess.ipcOnCallRequest(this, this.scripts, message.data);
        break;
      }
    }
  }

}

/** Node.js scripts module. */
export class Scripts extends Module {

  /** Default module name. */
  public static readonly moduleName: string = "Scripts";

  /** Environment variable names. */
  public static readonly ENV = {
    /** Scripts directory path (required). */
    PATH: "SCRIPTS_PATH",
  };

  /** Log names. */
  public static readonly LOG = {
    WORKER_START: "Scripts.WorkerStart",
    WORKER_STOP: "Scripts.WorkerStop",
    WORKER_EXIT: "Scripts.WorkerExit",
    WORKER_RESTART: "Scripts.WorkerRestart",
    WORKER_RESTART_LIMIT: "Scripts.WorkerRestartLimit",
    WORKER_UPTIME_LIMIT: "Scripts.WorkerUptimeLimit",
  };

  /** Metric names. */
  public static readonly METRIC = {
    IPC_CONNECT: "Scripts.IpcConnect",
    IPC_ERROR: "Scripts.IpcError",
    IPC_MESSAGE: "Scripts.IpcMessage",
  };

  /** Observable stream of sockets connected via IPC. */
  public readonly ipcConnections$ = new Subject<Socket>();

  /** Observable stream of IPC errors. */
  public readonly ipcErrors$ = new Subject<ScriptsError>();

  /** Observable stream of messages received via IPC. */
  public readonly ipcMessages$ = new Subject<IScriptsIpcMessage>();

  /** Absolute path to script files directory. */
  public readonly path = isDirectory(this.environment.get(Scripts.ENV.PATH));

  /** Workers state. */
  protected readonly scriptsWorkers: { [name: string]: IScriptsWorker } = {};

  /** Process module dependency. */
  protected readonly process!: Process;

  public constructor(options: IModuleOptions) {
    super(options);

    // Debug environment variables.
    this.debug(`${Scripts.ENV.PATH}="${this.path}"`);

    // Configure IPC for worker scripts.
    ipc.config.appspace = `${this.process.title}.`;
    ipc.config.id = this.namespace;
    ipc.config.logger = Debug(`node-ipc:${this.namespace}`);
    ipc.serve(() => {
      ipc.server.on("connect", (socket: Socket) => {
        this.ipcConnections$.next(this.scriptsIpcOnConnect(socket));
      });
      ipc.server.on("error", (error: any) => {
        this.ipcErrors$.next(this.scriptsIpcOnError(error));
      });
      ipc.server.on("message", (data: any, socket: Socket) => {
        this.ipcMessages$.next(this.scriptsIpcOnMessage(data, socket));
      });
    });
    ipc.server.start();
  }

  /** Scripts module depends on Process. */
  public moduleDependencies(...previous: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...previous, {
      process: Process,
    });
  }

  /** Wait for worker processes to exit. */
  public moduleDown(): void | Observable<void> {
    const observables$ = keys(this.scriptsWorkers).map((name) => {
      return this.stopWorker(name);
    });
    if (observables$.length > 0) {
      return Observable.forkJoin(...observables$).map(() => undefined);
    }
  }

  public moduleDestroy(): void {
    // Stop IPC server on process end.
    ipc.server.stop();
  }

  /** Spawn new Node.js process using script file. */
  public fork(fileName: string, options: IScriptsOptions = {}): ScriptsProcess {
    const forkEnv = this.environment.copy(options.env || {});

    // Check script file exists and fork.
    const filePath = isFile(resolve(this.path, fileName));
    const process = fork(filePath, options.args || [], { env: forkEnv.variables });
    return new ScriptsProcess(this, fileName, process);
  }

  public startWorker(name: string, fileName: string, options: IScriptsWorkerOptions = {}): Observable<ScriptsProcess> {
    const uptimeLimit = this.scriptsWorkerUptimeLimit(options.uptimeLimit);
    options.env = {
      ...options.env,
      // Set IPC id for ChildProcess module.
      [ChildProcess.ENV.IPC_ID]: this.namespace,
    };
    const process = this.fork(fileName, options);

    if (this.scriptsWorkers[name] == null) {
      // New worker, create new observables.
      const next$ = new BehaviorSubject<ScriptsProcess>(process);
      const unsubscribe$ = new Subject<void>();
      this.scriptsWorkers[name] = { next$, unsubscribe$, restarts: 0 };

      // Log worker start.
      const metadata = this.scriptsWorkerLogMetadata({ name, worker: this.scriptsWorkers[name], options });
      this.log.info(Scripts.LOG.WORKER_START, metadata);
    } else {
      // Restarted worker, update process in state.
      this.scriptsWorkers[name].unsubscribe$.next();
      this.scriptsWorkers[name].next$.next(process);
      this.scriptsWorkers[name].restarts += 1;
    }
    const worker = this.scriptsWorkers[name];

    // Handle worker restarts.
    process.exit$
      .takeUntil(worker.unsubscribe$)
      .subscribe((code) => {
        // Log worker exit.
        const metadata = this.scriptsWorkerLogMetadata({ name, worker, code });
        this.log.info(Scripts.LOG.WORKER_EXIT, metadata);

        // Restart worker process by default.
        if ((options.restart == null) || !!options.restart) {
          // Do not restart process if limit reached.
          if ((options.restartLimit == null) || (worker.restarts < options.restartLimit)) {
            this.log.info(Scripts.LOG.WORKER_RESTART, metadata);
            this.startWorker(name, fileName, options);
          } else {
            this.log.error(Scripts.LOG.WORKER_RESTART_LIMIT, metadata);
            this.stopWorker(name);
          }
        }
      });

    // Track worker process uptime.
    process.listen<IProcessStatus>(ChildProcess.EVENT.STATUS)
      .takeUntil(worker.unsubscribe$)
      .subscribe((status) => {
        // Kill worker process if uptime limit exceeded.
        if ((uptimeLimit != null) && (status.uptime > uptimeLimit)) {
          const metadata = this.scriptsWorkerLogMetadata({ name, worker });
          this.log.info(Scripts.LOG.WORKER_UPTIME_LIMIT, metadata);
          process.kill();
        }
      });

    return worker.next$
      .switchMap<ScriptsProcess, [ScriptsProcess, Socket]>((proc) => {
        let connection$: Observable<Socket | undefined> = Observable.of(undefined);

        // Wait for IPC socket connection unless disabled.
        if (!options.disableIpc) {
          connection$ = this.ipcConnections$
            .timeout(1000)
            .catch((error) => Observable.throw(new ScriptsError(error)))
            .take(1);
        }

        return Observable.forkJoin(
          Observable.of(proc),
          connection$,
        );
      })
      .map(([proc, socket]) => {
        proc.ipcSocket = socket;
        return proc;
      });
  }

  public stopWorker(name: string): Observable<string | number> {
    const worker = this.scriptsWorkers[name];
    let observable$: Observable<string | number> = Observable.of(0);

    if (worker != null) {
      const process = worker.next$.value;

      // Observables clean up.
      worker.unsubscribe$.next();
      worker.unsubscribe$.complete();
      worker.next$.complete();

      // End process if connected.
      if (process.isConnected) {
        observable$ = process.kill();
      }

      // Log worker stop and delete in state.
      const metadata = this.scriptsWorkerLogMetadata({ name, worker });
      this.log.info(Scripts.LOG.WORKER_STOP, metadata);
      delete this.scriptsWorkers[name];
    }

    return observable$;
  }

  protected scriptsIpcOnConnect(socket: Socket): Socket {
    this.metric.increment(Scripts.METRIC.IPC_CONNECT);
    return socket;
  }

  protected scriptsIpcOnError(error: any): ScriptsError {
    this.metric.increment(Scripts.METRIC.IPC_ERROR, 1, { error: ErrorChain.errorName(error) });
    const chained = new ScriptsError(error);
    this.log.error(chained);
    return chained;
  }

  protected scriptsIpcOnMessage(data: any, socket: Socket): IScriptsIpcMessage {
    this.metric.increment(Scripts.METRIC.IPC_MESSAGE);
    return { socket, data };
  }

  protected scriptsWorkerUptimeLimit(limit?: string): number | null {
    if (limit != null) {
      try {
        const duration = isDuration(limit).shiftTo("seconds").toObject();
        return duration.seconds || null;
      } catch (error) {
        throw new ScriptsError(error);
      }
    }
    return null;
  }

  protected scriptsWorkerLogMetadata(data: {
    name: string;
    worker: IScriptsWorker;
    options?: IScriptsWorkerOptions;
    code?: string | number;
  }): ILogMetadata {
    const metadata: ILogMetadata = {
      name: data.name,
      restarts: data.worker.restarts,
    };
    if (data.options != null) {
      metadata.restart = data.options.restart;
      metadata.restartLimit = data.options.restartLimit;
      metadata.uptimeLimit = data.options.uptimeLimit;
    }
    if (data.code != null) {
      metadata.code = data.code;
    }
    return metadata;
  }

}
