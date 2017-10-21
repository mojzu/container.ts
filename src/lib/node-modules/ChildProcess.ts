import * as process from "process";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/observable/interval";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/takeWhile";
import "rxjs/add/operator/timeout";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { IContainerLogMessage, IModuleOpts, Module } from "../../container";
import { ErrorChain, IErrorChainSerialised } from "../error";
import { IProcessStatus, Process, ProcessError } from "./Process";

/** Process message types. */
export enum EProcessMessageType {
  Log,
  Metric,
  CallRequest,
  CallResponse,
  Event,
  User,
}

/** Process call method options. */
export interface IProcessCallOptions {
  timeout?: number;
  args?: any[];
}

/** Process call function signature. */
export type IProcessCallType = (...args: any[]) => Observable<any>;

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
  error?: IErrorChainSerialised;
  complete?: boolean;
}

/** Process event message data. */
export interface IProcessEventData {
  name: string;
  data?: any;
}

/** Process data types. */
export type IProcessMessageData = IContainerLogMessage
  | IProcessCallRequestData
  | IProcessCallResponseData
  | IProcessEventData
  | any;

/** Process message interface. */
export interface IProcessMessage extends Object {
  type: EProcessMessageType;
  data: IProcessMessageData;
}

/** Process send method interface. */
export interface IProcessSend {
  messages: Observable<IProcessMessage>;
  send: (type: EProcessMessageType, data: any) => void;
}

export class ChildProcess extends Process implements IProcessSend {

  /** Default module name. */
  public static readonly NAME: string = "ChildProcess";

  /** Default call method timeout (10s). */
  public static readonly DEFAULT_TIMEOUT = 10000;

  /** Default interval to send status events (1m). */
  public static readonly DEFAULT_STATUS_INTERVAL = 60000;

  /** Environment variable names. */
  public static readonly ENV = {
    /** Application log level (default info). */
    NAME: "CHILD_PROCESS_NAME",
  };

  /** Class event names. */
  public static readonly EVENT = {
    STATUS: "status",
  };

  /** Extract serialisable error properties to object. */
  public static serialiseError(error: Error): IErrorChainSerialised {
    return new ProcessError(error).serialise();
  }

  /** Convert serialised error to error instance. */
  public static deserialiseError(error: IErrorChainSerialised): ProcessError {
    return ErrorChain.deserialise(error) || new ProcessError();
  }

  /** Send call request to process. */
  public static sendCallRequest<T>(
    emitter: IProcessSend,
    mod: Module,
    target: string,
    method: string,
    id: number,
    options: IProcessCallOptions = {},
  ): Observable<T> {
    const timeout = options.timeout || ChildProcess.DEFAULT_TIMEOUT;
    const args = options.args || [];

    mod.debug(`CALL="${target}.${method}" "${id}"`);

    // Send call request to process.
    const sendData: IProcessCallRequestData = { id, target, method, args };
    emitter.send(EProcessMessageType.CallRequest, sendData);

    return ChildProcess.handleCallResponse<T>(emitter.messages, id, args, timeout);
  }

  /** Handle method call requests. */
  public static handleCallRequest(
    emitter: IProcessSend,
    mod: Module,
    data: IProcessCallRequestData,
  ): void {
    const type = EProcessMessageType.CallResponse;
    const responseData: IProcessCallResponseData = { id: data.id };

    try {
      // Retrieve target module and make subscribe call to method.
      const targetMod = mod.container.resolve<any>(data.target);
      const method: IProcessCallType = targetMod[data.method].bind(targetMod);

      method(...data.args)
        .subscribe({
          next: (next) => {
            const nextData = Object.assign({ next }, responseData);
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
    messages: Observable<IProcessMessage>,
    id: number,
    args: any[],
    timeout: number,
  ): Observable<T> {
    return messages
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

  /** Send event to process. */
  public static sendEvent<T>(
    emitter: IProcessSend,
    mod: Module,
    name: string,
    data?: T,
  ): void {
    mod.debug(`EVENT="${name}"`);

    // Send event request to child process.
    const sendData: IProcessEventData = { name, data };
    emitter.send(EProcessMessageType.Event, sendData);
  }

  /** Listen for events from process. */
  public static listenForEvent<T>(
    events: Observable<IProcessEventData>,
    name: string,
  ): Observable<T> {
    return events
      .filter((event) => name === event.name)
      .map((event) => event.data as T);
  }

  /** Messages received from parent process. */
  public readonly messages = Observable.fromEvent<IProcessMessage>(process, "message");

  /** Events received from parent process. */
  public readonly events = new Subject<IProcessEventData>();

  protected currentIdentifier = 0;

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Listen for and handle messages from parent process.
    this.messages
      .subscribe((message) => this.handleMessage(message));

    // Forward log and metric messages to parent process.
    this.container.logs$
      .subscribe((log) => this.send(EProcessMessageType.Log, log));

    this.container.metrics$
      .subscribe((metric) => this.send(EProcessMessageType.Metric, metric));

    // Send status event on interval.
    Observable.interval(ChildProcess.DEFAULT_STATUS_INTERVAL)
      .subscribe(() => this.event<IProcessStatus>(ChildProcess.EVENT.STATUS, this.status));
  }

  /** Send message to parent process. */
  public send(type: EProcessMessageType, data: any): void {
    if (process.send != null) {
      process.send({ type, data });
    }
  }

  /** Make call to module.method in parent process. */
  public call<T>(target: string, method: string, options: IProcessCallOptions = {}): Observable<T> {
    return ChildProcess.sendCallRequest<T>(this, this, target, method, this.nextIdentifier, options);
  }

  /** Send event with optional data to parent process. */
  public event<T>(name: string, data?: T): void {
    ChildProcess.sendEvent<T>(this, this, name, data);
  }

  /** Listen for event sent by parent process. */
  public listen<T>(name: string): Observable<T> {
    return ChildProcess.listenForEvent<T>(this.events, name);
  }

  /** Incrementing counter for unique identifiers. */
  protected get nextIdentifier(): number { return ++this.currentIdentifier; }

  /** Handle messages received from parent process. */
  protected handleMessage(message: IProcessMessage): void {
    switch (message.type) {
      // Call request received from parent.
      case EProcessMessageType.CallRequest: {
        ChildProcess.handleCallRequest(this, this, message.data);
        break;
      }
      // Send event on internal event bus.
      case EProcessMessageType.Event: {
        const event: IProcessEventData = message.data;
        this.events.next(event);
        break;
      }
    }
  }

}
