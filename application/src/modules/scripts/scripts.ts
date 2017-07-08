/// <reference types="node" />
import * as assert from "assert";
import * as path from "path";
import * as childProcess from "child_process";
import * as constants from "../../constants";
import { IContainerModuleOpts, ContainerModule } from "../../container";
import { Process } from "../process";

/** Script process options. */
export interface IScriptOptions {
  args?: string[];
}

/** Spawned script process interface. */
export class ScriptProcess {

  public get scripts(): Scripts { return this._scripts; }
  public get process(): childProcess.ChildProcess { return this._process; }
  public get options(): IScriptOptions { return this._options; }

  public constructor(
    private _scripts: Scripts,
    private _process: childProcess.ChildProcess,
    private _options: IScriptOptions = {},
  ) {
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

    // Use container environment when spawning processes.
    // Set process title and override name value to prepend namespace.
    const name = `${this.namespace}:${target}:${this.counter}`;
    forkEnv
      .set(constants.ENV_TITLE, Process.title)
      .set(constants.ENV_NAME, name);

    const forkOptions: childProcess.ForkOptions = {
      env: forkEnv.variables,
    };

    const process = childProcess.fork(filePath, forkArgs, forkOptions);
    return new ScriptProcess(this, process, options);
  }

}
