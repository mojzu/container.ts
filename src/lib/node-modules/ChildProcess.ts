import * as net from "net";
import * as process from "process";
import { IContainerLogMessage, IModuleOpts, Module } from "../../container";
import { Observable, Subject } from "../../container/RxJS";
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
  messages$: Observable<IProcessMessage>;
  send: (type: EProcessMessageType, data: any) => void;
}

export class ChildProcess extends Process implements IProcessSend {

  /** Default module name. */
  public static readonly NAME: string = "ChildProcess";

  /** Default values. */
  public static readonly DEFAULT = {
    /** Default call method timeout (10s). */
    TIMEOUT: 10000,
    /** Default interval to send status events (1m). */
    STATUS_INTERVAL: 60000,
    /** Socket data encoding. */
    ENCODING: "utf8",
  };

  /** Class event names. */
  public static readonly EVENT = {
    SOCKET: "socket",
    STATUS: "status",
  };

  /** Configure socket for interprocess communication. */
  public static socketConfigure(options: {
    socket: net.Socket;
    onError: (error: ProcessError) => void;
    onData: (data: IProcessMessage) => void;
  }): net.Socket {
    // Set encoding to receive serialised string data.
    options.socket.setEncoding(ChildProcess.DEFAULT.ENCODING);

    // Socket observable events.
    const close$ = Observable.fromEvent<void>(options.socket, "close");
    const data$ = Observable.fromEvent<string>(options.socket, "data");

    // Subscribe to socket events until closed.
    data$.takeUntil(close$)
      .subscribe((data) => {
        ChildProcess.socketDeserialise(data)
          .map((message) => options.onData(message));
      });

    return options.socket;
  }

  /** Serialise input data for socket. */
  public static socketSerialise(data: any): string {
    try {
      return `${JSON.stringify(data)}\n`;
    } catch (error) {
      throw new ProcessError(error);
    }
  }

  /** Deserialise input data from socket. */
  public static socketDeserialise(data: string): IProcessMessage[] {
    try {
      const packets = data.split(/\r?\n/);
      const messages: IProcessMessage[] = [];

      if (packets.length > 1) {
        for (let i = 0; i < (packets.length - 1); i++) {
          messages.push(JSON.parse(packets[i]));
        }
      }

      return messages;
    } catch (error) {
      throw new ProcessError(error);
    }
  }

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
    const timeout = options.timeout || ChildProcess.DEFAULT.TIMEOUT;
    const args = options.args || [];

    // Send call request to process.
    const sendData: IProcessCallRequestData = { id, target, method, args };
    emitter.send(EProcessMessageType.CallRequest, sendData);

    return ChildProcess.handleCallResponse<T>(emitter.messages$, id, args, timeout);
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
    messages$: Observable<IProcessMessage>,
    id: number,
    args: any[],
    timeout: number,
  ): Observable<T> {
    return messages$
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
    // Send event request to child process.
    const sendData: IProcessEventData = { name, data };
    emitter.send(EProcessMessageType.Event, sendData);
  }

  /** Listen for events from process. */
  public static listenForEvent<T>(
    events$: Observable<IProcessEventData>,
    name: string,
  ): Observable<T> {
    return events$
      .filter((event) => name === event.name)
      .map((event) => event.data as T);
  }

  /** Socket handle received from parent process. */
  public socket?: net.Socket;

  /** Messages received from parent process. */
  public readonly messages$ = new Subject<IProcessMessage>();

  /** Events received from parent process. */
  public readonly events$ = new Subject<IProcessEventData>();

  protected currentIdentifier = 0;

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Listen for a socket message to accept handle.
    process.once("message", (type: string, socket: net.Socket) => {
      if (type === ChildProcess.EVENT.SOCKET) {
        // Configure socket as message receiver.
        this.socket = ChildProcess.socketConfigure({
          socket,
          onError: (error) => this.log.error(error),
          onData: (data) => this.messages$.next(data),
        });
      }
    });

    // Process messages.
    Observable.fromEvent<IProcessMessage>(process, "message")
      .subscribe((message) => this.messages$.next(message));

    // Listen for and handle messages from parent process.
    this.messages$
      .subscribe((message) => this.handleMessage(message));

    // Forward log and metric messages to parent process.
    this.container.logs$
      .subscribe((log) => this.send(EProcessMessageType.Log, log));

    this.container.metrics$
      .subscribe((metric) => this.send(EProcessMessageType.Metric, metric));

    // Send status event on interval.
    Observable.interval(ChildProcess.DEFAULT.STATUS_INTERVAL)
      .subscribe(() => this.event<IProcessStatus>(ChildProcess.EVENT.STATUS, this.status));
  }

  /** Send message to parent process. */
  public send(type: EProcessMessageType, data: any): void {
    if (this.socket != null) {
      this.socket.write(ChildProcess.socketSerialise({ type, data }));
    } else if (process.send != null) {
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
    return ChildProcess.listenForEvent<T>(this.events$, name);
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
        this.events$.next(event);
        break;
      }
    }
  }

  /** Override process down handler to close socket if present. */
  protected onSignal(signal: string): void {
    if (this.socket != null) {
      this.socket.end();
      this.socket = undefined;
    }
    return super.onSignal(signal);
  }

}
