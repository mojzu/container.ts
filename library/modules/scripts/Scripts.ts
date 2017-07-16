/// <reference types="node" />
import * as assert from "assert";
import * as path from "path";
import * as childProcess from "child_process";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/take";
import "rxjs/add/operator/takeUntil";
import {
  IContainerLogMessage,
  IContainerMetricMessage,
  IContainerModuleOpts,
  ContainerModule,
} from "../../container";
import {
  EProcessMessageType,
  IProcessCallOptions,
  IProcessCallRequestData,
  IProcessMessage,
  IProcessSend,
  ChildProcess,
} from "../process/ChildProcess";

/** Script process options. */
export interface IScriptOptions {
  args?: string[];
}

// TODO: Validation library.
export const ENV_SCRIPTS_PATH = "SCRIPTS_PATH";
export const ENV_SCRIPTS_NAME = "SCRIPTS_NAME";

/** Spawned script process interface. */
export class ScriptProcess implements IProcessSend {

  private _exit: Observable<number | string>;
  private _message: Observable<IProcessMessage>;
  private _identifier = 0;

  public get scripts(): Scripts { return this._scripts; }
  public get target(): string { return this._target; }
  public get id(): number { return this._id; }
  public get process(): childProcess.ChildProcess { return this._process; }
  public get options(): IScriptOptions { return this._options; }

  public get exit(): Observable<number | string> { return this._exit; }
  public get message(): Observable<IProcessMessage> { return this._message; }

  /** Incrementing counter for unique identifiers. */
  protected get identifier(): number { return ++this._identifier; }

  public constructor(
    private _scripts: Scripts,
    private _target: string,
    private _id: number,
    private _process: childProcess.ChildProcess,
    private _options: IScriptOptions = {},
  ) {
    this.scripts.debug(`fork '${_target}.${_id}'`);

    // Accumulate multiple callback arguments into array.
    const accumulator = (...args: any[]) => args;

    // Listen for process exit, reduce code/signal for next argument.
    this._exit = Observable.fromEvent(_process, "exit", accumulator)
      .take(1)
      .switchMap((args: [number | null, string | null]) => {
        const [code, signal] = args;
        const value = (typeof code === "number") ? code : signal;
        return Observable.of(value || 1);
      });

    this._exit.subscribe((code) => this.scripts.debug(`exit '${_target}.${_id}' '${code}'`));

    // Listen for process error, forward to scripts logger.
    Observable.fromEvent(_process, "error")
      .takeUntil(this._exit)
      .subscribe((error: Error) => this.scripts.log.error(error));

    // Listen for and handle process messages.
    this._message = Observable.fromEvent<IProcessMessage>(_process, "message")
      .takeUntil(this._exit);

    this._message
      .subscribe((message) => this.handleMessage(message));
  }

  /** Send message to child process. */
  public send(type: EProcessMessageType, data: any): void {
    this.process.send({ type, data });
  }

  /** Make call to module.method in child process. */
  public call<T>(target: string, method: string, options: IProcessCallOptions = {}): Observable<T> {
    const timeout = options.timeout || ChildProcess.DEFAULT_TIMEOUT;
    const args = options.args || [];
    const id = this.identifier;

    this.scripts.debug(`call '${this.target}.${this.id}.${target}.${method}' '${id}'`);

    // Send call request to child process.
    const sendData: IProcessCallRequestData = { id, target, method, args };
    this.send(EProcessMessageType.CallRequest, sendData);

    return ChildProcess.handleCallResponse(this.message, id, args, timeout);
  }

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
        ChildProcess.handleCallRequest(this, this.scripts.container, message.data);
        break;
      }
    }
  }

}

/** Node.js scripts interface. */
export class Scripts extends ContainerModule {

  private _path: string;

  public get path(): string { return this._path; }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get scripts directory path from environment.
    const scriptsPath = this.environment.get(ENV_SCRIPTS_PATH);
    assert(scriptsPath != null, "Scripts path is undefined");
    this._path = path.resolve(scriptsPath);
    this.debug(`path '${this.path}'`);
  }

  /** Spawn new Node.js process using script file. */
  public fork(target: string, options: IScriptOptions = {}): ScriptProcess {
    const filePath = path.resolve(this.path, target);
    const forkArgs = options.args || [];
    const forkEnv = this.environment.copy();
    const identifier = this.identifier;

    // Use container environment when spawning processes.
    // Override name value to prepend application namespace.
    const name = `${this.namespace}.${target}.${identifier}`;
    forkEnv.set(ENV_SCRIPTS_NAME, name);

    const forkOptions: childProcess.ForkOptions = {
      env: forkEnv.variables,
    };

    const process = childProcess.fork(filePath, forkArgs, forkOptions);
    return new ScriptProcess(this, target, identifier, process, options);
  }

}
