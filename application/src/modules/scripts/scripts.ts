/// <reference types="node" />
import * as assert from "assert";
import * as path from "path";
import * as childProcess from "child_process";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/take";
import "rxjs/add/operator/takeUntil";
import * as constants from "../../constants";
import { IContainerLogMessage, IContainerModuleOpts, ContainerModule } from "../../container";
import { EProcessMessageType, IProcessMessage } from "../process";

/** Script process options. */
export interface IScriptOptions {
  args?: string[];
}

/** Spawned script process interface. */
export class ScriptProcess {

  private _exit: Observable<number | string>;
  private _message: Observable<IProcessMessage>;

  public get scripts(): Scripts { return this._scripts; }
  public get target(): string { return this._target; }
  public get id(): number { return this._id; }
  public get process(): childProcess.ChildProcess { return this._process; }
  public get options(): IScriptOptions { return this._options; }

  public get exit(): Observable<number | string> { return this._exit; }
  public get message(): Observable<IProcessMessage> { return this._message; }

  public constructor(
    private _scripts: Scripts,
    private _target: string,
    private _id: number,
    private _process: childProcess.ChildProcess,
    private _options: IScriptOptions = {},
  ) {
    this.scripts.debug(`fork '${_target}:${_id}'`);

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

    this._exit.subscribe((code) => this.scripts.debug(`exit '${_target}:${_id}' '${code}'`));

    // Listen for process error, forward to scripts logger.
    // TODO: Add script metadata.
    Observable.fromEvent(_process, "error")
      .takeUntil(this._exit)
      .subscribe((error: Error) => this.scripts.log.error(error));

    // Listen for and handle process messages.
    this._message = Observable.fromEvent<IProcessMessage>(_process, "message")
      .takeUntil(this._exit);

    this._message
      .subscribe((message) => this.handleMessage(message));
  }

  /** Handle messages received from child process. */
  protected handleMessage(message: IProcessMessage): void {
    switch (message.type) {
      // Send received log message on container bus.
      case EProcessMessageType.Log: {
        const data: IContainerLogMessage = message.data;
        this.scripts.container.sendLog(data.level, data.message, data.metadata, data.args);
        break;
      }
    }
  }

}

/** Node.js scripts interface. */
export class Scripts extends ContainerModule {

  private _path: string;
  private _counter = 0;

  public get path(): string { return this._path; }

  /** Incrementing counter for script namespaces. */
  protected get counter(): number { return ++this._counter; }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get scripts directory path from environment.
    const scriptsPath = this.environment.get(constants.ENV_SCRIPTS);
    assert(scriptsPath != null, "Scripts path is undefined");
    this._path = path.resolve(scriptsPath);
    this.debug(`path '${this.path}'`);
  }

  /** Spawn new Node.js process using script file. */
  public fork(target: string, options: IScriptOptions = {}): ScriptProcess {
    const filePath = path.resolve(this.path, target);
    const forkArgs = options.args || [];
    const forkEnv = this.environment.copy();
    const counter = this.counter;

    // Use container environment when spawning processes.
    // Override name value to prepend application namespace.
    const name = `${this.namespace}:${target}:${counter}`;
    forkEnv.set(constants.ENV_NAME, name);

    const forkOptions: childProcess.ForkOptions = {
      env: forkEnv.variables,
    };

    const process = childProcess.fork(filePath, forkArgs, forkOptions);
    return new ScriptProcess(this, target, counter, process, options);
  }

}
