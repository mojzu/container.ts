/// <reference types="node" />
import * as process from "process";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import { IContainerLogMessage, IContainerModuleOpts } from "../../container";
import { Process } from "./process";

/** Process message types. */
export enum EProcessMessageType {
  Log,
  User,
}

/** Process data types. */
export type ProcessMessageData = IContainerLogMessage | any;

/** Process message interface. */
export interface IProcessMessage extends Object {
  type: EProcessMessageType;
  data: ProcessMessageData;
}

export class ChildProcess extends Process {

  private _message: Observable<IProcessMessage>;

  /** Messages received from parent process. */
  public get message(): Observable<IProcessMessage> { return this._message; }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Listen for and handle messages from parent process.
    this._message = Observable.fromEvent(process, "message");

    this._message
      .subscribe((message) => this.handleMessage(message));

    // Forward log messages to parent process.
    this.container.getLogs()
      .subscribe((log) => this.send(EProcessMessageType.Log, log));
  }

  /** Send message to parent process. */
  public send(type: EProcessMessageType, data: any): void {
    if (process.send != null) {
      process.send({ type, data });
    }
  }

  /** Handle messages received from parent process. */
  protected handleMessage(message: IProcessMessage): void {
    // TODO: Call interface.
  }

}
