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
  Socket,
  User,
}

/** Process call method options. */
export interface IProcessCallOptions {
  timeout?: number;
  args?: any[];
  channel?: string;
}

/** Process event method options. */
export interface IProcessEventOptions<T> {
  data?: T;
  channel?: string;
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
  channel?: string;
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
  channel?: string;
}

/** Process send method interface. */
export interface IProcessSend {
  messages$: Observable<IProcessMessage>;
  send: (type: EProcessMessageType, data: any, channel?: string) => void;
}

export class ChildProcess extends Process implements IProcessSend {

  /** Default module name. */
  public static readonly moduleName: string = "ChildProcess";

  /** Default values. */
  public static readonly DEFAULT = {
    /** Default call method timeout (10s). */
    TIMEOUT: 10000,
    /** Default interval to send status events (1m). */
    STATUS_INTERVAL: 60000,
    /** Default socket channel. */
    CHANNEL: "_",
    /** Socket data encoding. */
    ENCODING: "utf8",
  };

  /** Class event names. */
  public static readonly EVENT = {
    SOCKET: "socket",
    CHANNEL: "channel",
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
    // TODO(LOW): Fix fromEvent emitter types.
    const close$ = Observable.fromEvent<void>(options.socket as any, "close");
    const data$ = Observable.fromEvent<string>(options.socket as any, "data");

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
      const packets = data.split(/\n/);
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
    emitter.send(EProcessMessageType.CallRequest, sendData, options.channel);

    return ChildProcess.handleCallResponse<T>(emitter.messages$, id, args, timeout);
  }

  /** Handle method call requests. */
  public static handleCallRequest(
    emitter: IProcessSend,
    mod: Module,
    data: IProcessCallRequestData,
    channel?: string,
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
            emitter.send(type, nextData, channel);
          },
          error: (error) => {
            error = ChildProcess.serialiseError(error);
            const errorData = Object.assign({ error }, responseData);
            emitter.send(type, errorData, channel);
          },
          complete: () => {
            const completeData = Object.assign({ complete: true }, responseData);
            emitter.send(type, completeData, channel);
          },
        });

    } catch (error) {
      error = ChildProcess.serialiseError(error);
      const errorData = Object.assign({ error }, responseData);
      emitter.send(type, errorData, channel);
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
    options: IProcessEventOptions<T> = {},
  ): void {
    // Send event request to child process.
    const sendData: IProcessEventData = { name, ...options };
    emitter.send(EProcessMessageType.Event, sendData, options.channel);
  }

  /** Listen for events from process. */
  public static listenForEvent<T>(
    events$: Observable<IProcessEventData>,
    name: string,
    channel?: string,
  ): Observable<T> {
    return events$
      .filter((event) => {
        return (name === event.name) && (channel === event.channel);
      })
      .map((event) => event.data as T);
  }

  /** Socket handle received from parent process. */
  public sockets: { [key: string]: net.Socket | undefined } = {};

  /** Messages received from parent process. */
  public readonly messages$ = new Subject<IProcessMessage>();

  /** Events received from parent process. */
  public readonly events$ = new Subject<IProcessEventData>();

  protected currentIdentifier = 0;

  public constructor(opts: IModuleOpts) {
    super(opts);

    // Listen for a socket message to accept handle.
    process.once("message", (type: string, socket: net.Socket) => {
      if (type === ChildProcess.EVENT.SOCKET) {
        // Configure socket default channel as message receiver.
        const channel = ChildProcess.DEFAULT.CHANNEL;
        this.sockets[channel] = ChildProcess.socketConfigure({
          socket,
          onError: (error) => this.log.error(error),
          onData: (data) => this.messages$.next(data),
        });
      }
    });

    // Process messages.
    Observable.fromEvent<IProcessMessage>(process as any, "message")
      .subscribe((message) => this.messages$.next(message));

    // Listen for and handle messages from parent process.
    this.messages$
      .subscribe((message) => this.handleMessage(message));

    // Forward log and metric messages to parent process only.
    // Do not pass channel into send, defaults to parent.
    this.container.logs$
      .subscribe((log) => this.send(EProcessMessageType.Log, log));

    this.container.metrics$
      .subscribe((metric) => this.send(EProcessMessageType.Metric, metric));

    // Send status event on interval.
    Observable.interval(ChildProcess.DEFAULT.STATUS_INTERVAL)
      .subscribe(() => this.event<IProcessStatus>(ChildProcess.EVENT.STATUS, { data: this.status }));
  }

  /** Send message to channel process. */
  public send(type: EProcessMessageType, data: any, channel?: string): void {
    const socket = this.sockets[channel || ChildProcess.DEFAULT.CHANNEL];
    if (socket != null) {
      socket.write(ChildProcess.socketSerialise({ type, data }));
    } else if (process.send != null) {
      process.send({ type, data });
    }
  }

  /** Make call to module.method in parent process. */
  public call<T>(target: string, method: string, options: IProcessCallOptions = {}): Observable<T> {
    return ChildProcess.sendCallRequest<T>(this, this, target, method, this.nextIdentifier, options);
  }

  /** Send event with optional data to parent process. */
  public event<T>(name: string, options: IProcessEventOptions<T> = {}): void {
    ChildProcess.sendEvent<T>(this, this, name, options);
  }

  /** Listen for event sent by parent process. */
  public listen<T>(name: string, channel?: string): Observable<T> {
    return ChildProcess.listenForEvent<T>(this.events$, name, channel);
  }

  /** Incrementing counter for unique identifiers. */
  protected get nextIdentifier(): number { return ++this.currentIdentifier; }

  /** Handle messages received from parent process. */
  protected handleMessage(message: IProcessMessage): void {
    switch (message.type) {
      // Call request received from parent.
      case EProcessMessageType.CallRequest: {
        ChildProcess.handleCallRequest(this, this, message.data, message.channel);
        break;
      }
      // Send event on internal event bus.
      case EProcessMessageType.Event: {
        const event: IProcessEventData = message.data;
        this.events$.next(event);
        break;
      }
      // Socket event received from parent.
      case EProcessMessageType.Socket : {
        const channel = message.data;
        const listener = (type: string, socket: net.Socket) => {
          if (type === ChildProcess.EVENT.SOCKET) {
            let socketChannel = this.sockets[channel];

            // End socket channel if it exists.
            if (socketChannel != null) {
              socketChannel.end();
              this.sockets[channel] = undefined;
            }

            // Configure socket as channel.
            socketChannel = ChildProcess.socketConfigure({
              socket,
              onError: (error) => this.log.error(error),
              onData: (data) => {
                data.channel = channel;
                this.messages$.next(data);
              },
            });

            // Remove process listener, send event to parent.
            this.sockets[channel] = socketChannel;
            process.removeListener("message", listener);
            this.event(ChildProcess.EVENT.CHANNEL, { data: message.data });
          }
        };
        // Listen for a socket message to accept handle.
        process.on("message", listener);
        break;
      }
    }
  }

  /** Override process down handler to close socket if present. */
  protected onSignal(signal: string): void {
    Object.keys(this.sockets).map((channel) => {
      const socket = this.sockets[channel];
      if (socket != null) {
        socket.end();
      }
      this.sockets[channel] = undefined;
    });
    return super.onSignal(signal);
  }

}
