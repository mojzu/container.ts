import * as assert from "assert";
import * as path from "path";
import * as childProcess from "child_process";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/of";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/take";
import "rxjs/add/operator/takeUntil";
import {
  IContainerLogMessage,
  IContainerMetricMessage,
  ContainerModule,
} from "../container";
import { ErrorChain } from "../lib/error";
import { Validate } from "../lib/validate";
import {
  EProcessMessageType,
  IProcessCallOptions,
  IProcessEventData,
  IProcessMessage,
  IProcessSend,
  ChildProcess,
} from "./ChildProcess";

/** Script process options. */
export interface IScriptOptions {
  args?: string[];
}

/** Script error class. */
export class ScriptError extends ErrorChain {
  public constructor(target: string, cause?: Error) {
    super({ name: "ScriptError", value: target }, cause);
  }
}

/** Spawned script process interface. */
export class ScriptProcess implements IProcessSend {

  private _exit: Observable<number | string>;
  private _messages: Observable<IProcessMessage>;
  private _events = new Subject<IProcessEventData>();
  private _identifier = 0;

  public get script(): Script { return this._script; }
  public get target(): string { return this._target; }
  public get process(): childProcess.ChildProcess { return this._process; }
  public get options(): IScriptOptions { return this._options; }

  public get exit(): Observable<number | string> { return this._exit; }
  public get messages(): Observable<IProcessMessage> { return this._messages; }
  public get events(): Observable<IProcessEventData> { return this._events; }

  public get connected(): boolean { return this._process.connected; }

  /** Incrementing counter for unique identifiers. */
  protected get identifier(): number { return ++this._identifier; }

  public constructor(
    private _script: Script,
    private _target: string,
    private _process: childProcess.ChildProcess,
    private _options: IScriptOptions = {},
  ) {
    this.script.debug(`FORK="${_target}"`);

    // Accumulate multiple callback arguments into array.
    const accumulator = (...args: any[]) => args;

    // Listen for process exit, reduce code/signal for next argument.
    this._exit = Observable.fromEvent(_process, "exit", accumulator)
      .take(1)
      .switchMap((args: [number | null, string | null]) => {
        const [code, signal] = args;
        const value = (typeof code === "number") ? code : signal;
        return Observable.of((value != null) ? value : 1);
      });

    this._exit.subscribe((code) => {
      this.script.debug(`EXIT="${_target}" CODE="${code}"`);

      // Log error if script exits with error code.
      if (code !== 0) {
        const error = new ScriptError(this.target);
        this.script.log.error(error);
      }
    });

    // Listen for process error, forward to script logger.
    Observable.fromEvent(_process, "error")
      .takeUntil(this._exit)
      .subscribe((error: Error) => {
        const chained = new ScriptError(this.target, error);
        this.script.log.error(chained);
      });

    // Listen for and handle process messages.
    this._messages = Observable.fromEvent<IProcessMessage>(_process, "message")
      .takeUntil(this._exit);

    this._messages
      .subscribe((message) => this.handleMessage(message));
  }

  /** End child process with signal. */
  public kill(signal?: string): Observable<number | string> {
    this.process.kill(signal);
    return this.exit;
  }

  /** Send message to child process. */
  public send(type: EProcessMessageType, data: any): void {
    this.process.send({ type, data });
  }

  /** Make call to module.method in child process. */
  public call<T>(target: string, method: string, options: IProcessCallOptions = {}): Observable<T> {
    return ChildProcess.sendCallRequest<T>(this, this.script, target, method, this.identifier, options);
  }

  /** Send event with optional data to child process. */
  public event<T>(name: string, data?: T): void {
    ChildProcess.sendEvent<T>(this, this.script, name, data);
  }

  /** Listen for event sent by child process. */
  public listen<T>(name: string): Observable<T> {
    return ChildProcess.listenForEvent<T>(this.events, name);
  }

  /** Handle messages received from child process. */
  protected handleMessage(message: IProcessMessage): void {
    switch (message.type) {
      // Send received log and metric messages to container.
      case EProcessMessageType.Log: {
        const data: IContainerLogMessage = message.data;
        this.script.container.sendLog(data.level, data.message, data.metadata, data.args);
        break;
      }
      case EProcessMessageType.Metric: {
        const data: IContainerMetricMessage = message.data;
        this.script.container.sendMetric(data.type, data.name, data.value, data.tags);
        break;
      }
      // Call request received from child.
      case EProcessMessageType.CallRequest: {
        ChildProcess.handleCallRequest(this, this.script, message.data);
        break;
      }
      // Send event on internal event bus.
      case EProcessMessageType.Event: {
        const event: IProcessEventData = message.data;
        this._events.next(event);
        break;
      }
    }
  }

}

/** Node.js scripts interface. */
export class Script extends ContainerModule {

  /** Default module name. */
  public static readonly NAME: string = "Script";

  /** Environment variable names. */
  public static readonly ENV = {
    /** Script directory path (required). */
    PATH: "SCRIPT_PATH",
  };

  private _path: string;

  public get path(): string { return this._path; }

  public setup(): void {
    super.setup();

    // Get script directory path from environment.
    const scriptPath = path.resolve(this.environment.get(Script.ENV.PATH));

    assert(scriptPath != null, "Scripts path is undefined");
    this._path = Validate.isDirectory(scriptPath);
    this.debug(`${Script.ENV.PATH}="${this.path}"`);
  }

  /** Spawn new Node.js process using script file. */
  public fork(target: string, options: IScriptOptions = {}): ScriptProcess {
    const forkArgs = options.args || [];
    const forkEnv = this.environment.copy();
    const identifier = this.identifier;

    // Use container environment when spawning processes.
    // Override name value to prepend application namespace.
    const name = `${this.namespace}.${target}.${identifier}`;
    forkEnv.set(ChildProcess.ENV.NAME, name);

    const forkOptions: childProcess.ForkOptions = {
      env: forkEnv.variables,
    };

    // Check script file exists.
    const filePath = Validate.isFile(path.resolve(this.path, target));
    const process = childProcess.fork(filePath, forkArgs, forkOptions);
    return new ScriptProcess(this, `${target}.${identifier}`, process, options);
  }

}
