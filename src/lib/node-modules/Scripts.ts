import * as childProcess from "child_process";
import * as net from "net";
import * as path from "path";
import {
  IContainerLogMessage,
  IContainerMetricMessage,
  IEnvironmentVariables,
  ILogMetadata,
  IModuleOpts,
  Module,
} from "../../container";
import { BehaviorSubject, Observable, Subject } from "../../container/RxJS";
import { ErrorChain } from "../error";
import { NodeValidate } from "../node-validate";
import {
  ChildProcess,
  EProcessMessageType,
  IProcessCallOptions,
  IProcessEventData,
  IProcessMessage,
  IProcessSend,
} from "./ChildProcess";
import { IProcessStatus } from "./Process";

/** Scripts process options. */
export interface IScriptsOptions {
  args?: string[];
  env?: IEnvironmentVariables;
  sockets?: {
    parent: net.Socket;
    child: net.Socket;
  };
}

/** Scripts worker options. */
export interface IScriptsWorkerOptions extends IScriptsOptions {
  /** Worker process should restart after exit. */
  restart?: boolean;
  /** Worker process restarts maximum number of times. */
  restartLimit?: number;
  /** Maximum script uptime as ISO8601 duration. */
  uptimeLimit?: string;
}

/** Scripts worker. */
export interface IScriptsWorker {
  process: ScriptsProcess;
  unsubscribe$: Subject<void>;
  next$: BehaviorSubject<ScriptsProcess>;
  restarts: number;
}

/** Scripts error class. */
export class ScriptsError extends ErrorChain {
  public constructor(cause?: Error) {
    super({ name: "ScriptsError" }, cause);
  }
}

/** ScriptsProcess error class. */
export class ScriptsProcessError extends ErrorChain {
  public constructor(target: string, cause?: Error) {
    super({ name: "ScriptsProcessError", value: target }, cause);
  }
}

/** Spawned scripts process interface. */
export class ScriptsProcess implements IProcessSend {

  public readonly exit$: Observable<number | string>;
  public readonly messages$ = new Subject<IProcessMessage>();
  public readonly events$ = new Subject<IProcessEventData>();

  public readonly socket?: net.Socket;

  public get isConnected(): boolean { return this.process.connected; }

  protected currentIdentifier = 0;

  public constructor(
    public readonly scripts: Scripts,
    public readonly target: string,
    public readonly process: childProcess.ChildProcess,
    public readonly options: IScriptsOptions,
  ) {
    // Accumulate multiple callback arguments into array.
    const accumulator = (...args: any[]) => args;

    // Listen for process exit, reduce code/signal for next argument.
    this.exit$ = Observable.fromEvent(process, "exit", accumulator)
      .take(1)
      .switchMap((args: [number | null, string | null]) => {
        const [code, signal] = args;
        const value = (typeof code === "number") ? code : signal;
        return Observable.of((value != null) ? value : 1);
      });

    this.exit$.subscribe((code) => {
      // Log error if script exits with error code.
      if (code !== 0) {
        const error = new ScriptsProcessError(this.target);
        this.scripts.log.error(error);
      }
    });

    // Listen for process error, forward to scripts logger.
    Observable.fromEvent(process, "error")
      .takeUntil(this.exit$)
      .subscribe((error: Error) => {
        const chained = new ScriptsProcessError(this.target, error);
        this.scripts.log.error(chained);
      });

    // If socket provided, configure parent as message receiver.
    // Send socket as handle to child process.
    if (options.sockets != null) {
      this.socket = ChildProcess.socketConfigure({
        socket: options.sockets.parent,
        onError: (error) => this.scripts.log.error(error),
        onData: (data) => this.messages$.next(data),
      });
      this.process.send("socket", options.sockets.child);
    }

    // Listen for and handle process messages.
    Observable.fromEvent<IProcessMessage>(process, "message")
      .takeUntil(this.exit$)
      .subscribe((message) => this.messages$.next(message));

    this.messages$
      .subscribe((message) => this.handleMessage(message));
  }

  /** End child process with signal. */
  public kill(signal?: string): Observable<number | string> {
    this.process.kill(signal);
    return this.exit$;
  }

  /** Send message to child process. */
  public send(type: EProcessMessageType, data: any): void {
    if (this.socket != null) {
      this.socket.write(ChildProcess.socketSerialise({ type, data }));
    } else {
      this.process.send({ type, data });
    }
  }

  /** Make call to module.method in child process. */
  public call<T>(target: string, method: string, options: IProcessCallOptions = {}): Observable<T> {
    return ChildProcess.sendCallRequest<T>(this, this.scripts, target, method, this.nextIdentifier, options);
  }

  /** Send event with optional data to child process. */
  public event<T>(name: string, data?: T): void {
    ChildProcess.sendEvent<T>(this, this.scripts, name, data);
  }

  /** Listen for event sent by child process. */
  public listen<T>(name: string): Observable<T> {
    return ChildProcess.listenForEvent<T>(this.events$, name);
  }

  /** Incrementing counter for unique identifiers. */
  protected get nextIdentifier(): number { return ++this.currentIdentifier; }

  /** Handle messages received from child process. */
  protected handleMessage(message: IProcessMessage): void {
    switch (message.type) {
      // Send received log and metric messages to container.
      case EProcessMessageType.Log: {
        const data: IContainerLogMessage = message.data;
        this.scripts.container.sendLog(data.level, data.message, data.metadata, data.args);
        break;
      }
      case EProcessMessageType.Metric: {
        const data: IContainerMetricMessage = message.data;
        this.scripts.container.sendMetric(data.type, data.name, data.value, data.tags);
        break;
      }
      // Call request received from child.
      case EProcessMessageType.CallRequest: {
        ChildProcess.handleCallRequest(this, this.scripts, message.data);
        break;
      }
      // Send event on internal event bus.
      case EProcessMessageType.Event: {
        const event: IProcessEventData = message.data;
        this.events$.next(event);
        break;
      }
    }
  }

}

/** Node.js scripts interface. */
export class Scripts extends Module {

  /** Default module name. */
  public static readonly NAME: string = "Scripts";

  /** Environment variable names. */
  public static readonly ENV = {
    /** Scripts directory path (required). */
    PATH: "SCRIPTS_PATH",
  };

  /** Log names. */
  public static readonly LOG = {
    WORKER_START: "ScriptsWorkerStart",
    WORKER_STOP: "ScriptsWorkerStop",
    WORKER_EXIT: "ScriptsWorkerExit",
    WORKER_RESTART: "ScriptsWorkerRestart",
    WORKER_RESTART_LIMIT: "ScriptsWorkerRestartLimit",
    WORKER_UPTIME_LIMIT: "ScriptsWorkerUptimeLimit",
  };

  public readonly path: string;
  public readonly workers: { [name: string]: IScriptsWorker } = {};

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Get script directory path from environment.
    const scriptsPath = path.resolve(this.environment.get(Scripts.ENV.PATH));
    this.path = NodeValidate.isDirectory(scriptsPath);
    this.debug(`${Scripts.ENV.PATH}="${this.path}"`);
  }

  public stop(): void | Observable<void> {
    const observables$: Array<Observable<any>> = [];

    // Wait for worker processes to exit if connected.
    Object.keys(this.workers).map((name) => {
      const worker = this.workers[name];
      worker.unsubscribe$.next();
      worker.unsubscribe$.complete();

      if ((worker.process.isConnected)) {
        observables$.push(worker.process.exit$);
      }
    });

    if (observables$.length > 0) {
      return Observable.forkJoin(...observables$).map(() => undefined);
    }
  }

  /** Spawn new Node.js process using script file. */
  public fork(target: string, options: IScriptsOptions = {}): ScriptsProcess {
    const forkEnv = this.environment.copy(options.env);

    // Use container environment when spawning processes.
    // Override name value to prepend application namespace.
    const name = `${this.namespace}.${target}`;
    forkEnv.set(ChildProcess.ENV.NAME, name);

    // Check script file exists and fork.
    const filePath = NodeValidate.isFile(path.resolve(this.path, target));
    const process = childProcess.fork(filePath, options.args || [], { env: forkEnv.variables });
    return new ScriptsProcess(this, target, process, options);
  }

  public startWorker(name: string, target: string, options: IScriptsWorkerOptions = {}): Observable<ScriptsProcess> {
    const uptimeLimit = this.validUptimeLimit(options.uptimeLimit);
    const process = this.fork(target, options);

    if (this.workers[name] == null) {
      // New worker, create new observables in workers state.
      const unsubscribe$ = new Subject<void>();
      const next$ = new BehaviorSubject<ScriptsProcess>(process);
      this.workers[name] = { process, unsubscribe$, next$, restarts: 0 };

      // Log worker start.
      const metadata = this.workerLogMetadata({ name, worker: this.workers[name], options });
      this.log.info(Scripts.LOG.WORKER_START, metadata);
    } else {
      // Restarted worker, reassign process in workers state.
      this.workers[name].unsubscribe$.next();
      this.workers[name].process = process;
      this.workers[name].next$.next(process);
      this.workers[name].restarts += 1;
    }
    const worker = this.workers[name];

    // Handle worker restarts.
    process.exit$
      .takeUntil(worker.unsubscribe$)
      .subscribe((code) => {
        // Log worker exit.
        const metadata = this.workerLogMetadata({ name, worker, code });
        this.log.info(Scripts.LOG.WORKER_EXIT, metadata);

        // Restart worker process by default.
        if ((options.restart == null) || !!options.restart) {
          // Do not restart process if limit reached.
          if ((options.restartLimit == null) || (worker.restarts < options.restartLimit)) {
            this.log.info(Scripts.LOG.WORKER_RESTART, metadata);
            this.startWorker(name, target, options);
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
          const metadata = this.workerLogMetadata({ name, worker });
          this.log.info(Scripts.LOG.WORKER_UPTIME_LIMIT, metadata);
          process.kill();
        }
      });

    return worker.next$;
  }

  public stopWorker(name: string): Observable<string | number> {
    const worker = this.workers[name];
    let observable$: Observable<string | number> = Observable.of(0);

    if (worker != null) {
      // Observables clean up.
      worker.unsubscribe$.next();
      worker.unsubscribe$.complete();
      worker.next$.complete();

      // End process if connected.
      if (worker.process.isConnected) {
        worker.process.kill();
        observable$ = worker.process.exit$;
      }

      // Log worker stop and delete in state.
      const metadata = this.workerLogMetadata({ name, worker });
      this.log.info(Scripts.LOG.WORKER_STOP, metadata);
      delete this.workers[name];
    }

    return observable$;
  }

  protected validUptimeLimit(limit?: string): number | null {
    if (limit != null) {
      try {
        const duration = NodeValidate.isDuration(limit);
        return duration.asSeconds();
      } catch (error) {
        throw new ScriptsError(error);
      }
    }
    return null;
  }

  protected workerLogMetadata(data: {
    name: string;
    worker: IScriptsWorker;
    options?: IScriptsWorkerOptions;
    code?: string | number;
  }): ILogMetadata {
    const metadata: ILogMetadata = {
      name: data.name,
      target: data.worker.process.target,
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
