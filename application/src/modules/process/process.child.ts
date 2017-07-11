/// <reference types="node" />
import * as process from "process";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/takeWhile";
import { IContainerLogMessage, IContainerModuleOpts, Container } from "../../container";
import { Process } from "./process";

/** Process message types. */
export enum EProcessMessageType {
  Log,
  Metric,
  CallRequest,
  CallResponse,
  User,
}

/** Process error object. */
export interface IProcessError {
  name?: string;
  message?: string;
  stack?: string;
}

/** Process error class. */
export class ProcessError extends Error implements IProcessError {
  public constructor(name: string, message: string, stack: string) {
    const error: any = super(message);
    this.name = error.name = name;
    this.message = error.message = message;
    this.stack = error.stack = stack;
  }
}

/** Process call method options. */
export interface IProcessCallOptions {
  timeout?: number;
  args?: any[];
}

/** Process call function signature. */
export type ProcessCallType = (...args: any[]) => Observable<any>;

/** Process call request message data. */
export interface IProcessCallRequestData {
  id: number;
  target: string;
  method: string;
  args: any[];
}

/** Process call response message data. */
export interface IProcessCallResponseData {
  id: number;
  next?: any;
  error?: IProcessError;
  complete?: boolean;
}

/** Process data types. */
export type ProcessMessageData = IContainerLogMessage
  | IProcessCallRequestData
  | IProcessCallResponseData
  | any;

/** Process message interface. */
export interface IProcessMessage extends Object {
  type: EProcessMessageType;
  data: ProcessMessageData;
}

/** Process send method interface. */
export interface IProcessSend {
  send: (type: EProcessMessageType, data: any) => void;
}

export class ChildProcess extends Process implements IProcessSend {

  /** Default call method timeout. */
  public static DEFAULT_TIMEOUT = 10000;

  /** Extract serialisable error properties to object. */
  public static serialiseError(error: Error): IProcessError {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  /** Convert serialised error to error instance. */
  public static deserialiseError(error: IProcessError): ProcessError {
    return new ProcessError(
      error.name || "",
      error.message || "",
      error.stack || "",
    );
  }

  /** Handle method call requests. */
  public static handleCallRequest(
    emitter: IProcessSend,
    container: Container,
    data: IProcessCallRequestData,
  ): void {
    const type = EProcessMessageType.CallResponse;
    const responseData: IProcessCallResponseData = { id: data.id };

    try {
      // Retrieve target module and make subscribe call to method.
      const mod = container.resolve<any>(data.target);
      const method: ProcessCallType = mod[data.method].bind(mod);

      method(...data.args)
        .subscribe({
          next: (value) => {
            const nextData = Object.assign({ next: value }, responseData);
            emitter.send(type, nextData);
          },
          error: (error) => {
            error = ChildProcess.serialiseError(error);
            const errorData = Object.assign({ error }, responseData);
            emitter.send(type, errorData);
          },
          complete: () => {
            const completeData = Object.assign({ complete: true }, responseData);
            emitter.send(type, completeData);
          },
        });

    } catch (error) {
      error = ChildProcess.serialiseError(error);
      const errorData = Object.assign({ error }, responseData);
      emitter.send(type, errorData);
    }
  }

  /** Handle method call responses. */
  public static handleCallResponse<T>(
    messageObservable: Observable<IProcessMessage>,
    id: number,
    args: any[],
    timeout: number,
  ): Observable<T> {
    return messageObservable
      .filter((message) => {
        // Filter by message type and identifier.
        if (message.type === EProcessMessageType.CallResponse) {
          const data: IProcessCallResponseData = message.data;
          return data.id === id;
        }
        return false;
      })
      .map((message) => {
        // Cast message data to type.
        const data: IProcessCallResponseData = message.data;
        return data;
      })
      .timeout(timeout)
      .takeWhile((data) => {
        // Complete observable when complete message received.
        return !data.complete;
      })
      .mergeMap((data) => {
        // Throw error or emit next data.
        if (data.error != null) {
          const error = ChildProcess.deserialiseError(data.error);
          return Observable.throw(error);
        } else {
          return Observable.of(data.next);
        }
      });
  }

  private _message: Observable<IProcessMessage>;

  /** Messages received from parent process. */
  public get message(): Observable<IProcessMessage> { return this._message; }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Listen for and handle messages from parent process.
    this._message = Observable.fromEvent(process, "message");

    this._message
      .subscribe((message) => this.handleMessage(message));

    // Forward log and metric messages to parent process.
    this.container.logs
      .subscribe((log) => this.send(EProcessMessageType.Log, log));
    this.container.metrics
      .subscribe((metric) => this.send(EProcessMessageType.Metric, metric));
  }

  /** Send message to parent process. */
  public send(type: EProcessMessageType, data: any): void {
    if (process.send != null) {
      process.send({ type, data });
    }
  }

  /** Make call to module.method in parent process. */
  public call<T>(target: string, method: string, options: IProcessCallOptions = {}): Observable<T> {
    const timeout = options.timeout || ChildProcess.DEFAULT_TIMEOUT;
    const args = options.args || [];
    const id = this.identifier;

    this.debug(`call '${target}.${method}' '${id}'`);

    // Send call request to parent process.
    const sendData: IProcessCallRequestData = { id, target, method, args };
    this.send(EProcessMessageType.CallRequest, sendData);

    return ChildProcess.handleCallResponse<T>(this.message, id, args, timeout);
  }

  /** Handle messages received from parent process. */
  protected handleMessage(message: IProcessMessage): void {
    switch (message.type) {
      // Call request received from parent.
      case EProcessMessageType.CallRequest: {
        ChildProcess.handleCallRequest(this, this.container, message.data);
        break;
      }
    }
  }

}
