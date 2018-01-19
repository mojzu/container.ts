import * as Debug from "debug";
import { assign } from "lodash";
import * as ipc from "node-ipc";
import { IModuleOptions, Module } from "../../container";
import { ErrorChain, IErrorChainSerialised } from "../error";
import { isString } from "../validate";
import { IProcessStatus, Process, ProcessError } from "./Process";
import { Observable, Subject } from "./RxJS";
import {
  EProcessMessageType,
  IProcessCall,
  IProcessCallOptions,
  IProcessCallRequest,
  IProcessCallResponse,
  IProcessEvent,
  IProcessEventOptions,
  IProcessMessage,
  IProcessMessageData,
  IProcessSend,
} from "./Types";

export class ChildProcess extends Process implements IProcessSend {

  /** Default module name. */
  public static readonly moduleName: string = "ChildProcess";

  /** Environment variable names. */
  public static readonly ENV = assign({}, Process.ENV, {
    IPC_ID: "CHILD_PROCESS_IPC_ID",
  });

  /** Event names. */
  public static readonly EVENT = {
    STATUS: "ChildProcessStatus",
  };

  public static ipcGenerateUid(): number {
    return Math.floor(Math.random() * (0xFFFF - 1) + 1);
  }

  /** Extract serialisable error properties to object. */
  public static ipcSerialiseError(error: Error): IErrorChainSerialised {
    return new ProcessError(error).serialise();
  }

  /** Convert serialised error to error instance. */
  public static ipcDeserialiseError(error: IErrorChainSerialised): ProcessError {
    return ErrorChain.deserialise(error) || new ProcessError();
  }

  /** Send event to process. */
  public static ipcSendEvent<T>(
    emitter: IProcessSend,
    mod: Module,
    name: string,
    options: IProcessEventOptions<T> = {},
  ): void {
    const data: IProcessEvent<T> = { name, ...options };
    emitter.send(EProcessMessageType.Event, data);
  }

  /** Listen for events from process. */
  public static ipcListenForEvent<T>(
    events$: Observable<IProcessEvent<any>>,
    name: string,
  ): Observable<T> {
    return events$
      .filter((event) => (name === event.name))
      .map((event) => event.data as T);
  }

  /** Send call request to process. */
  public static ipcSendCallRequest<T>(
    emitter: IProcessSend,
    mod: Module,
    target: string,
    method: string,
    options: IProcessCallOptions = {},
  ): Observable<T> {
    const uid = ChildProcess.ipcGenerateUid();
    const timeout = options.timeout || 10000;
    const args = options.args || [];

    // Send call request to process.
    const sendData: IProcessCallRequest = { uid, target, method, args };
    emitter.send(EProcessMessageType.CallRequest, sendData);

    return ChildProcess.ipcOnCallResponse<T>(emitter.messages$, uid, args, timeout);
  }

  /** Handle method call responses. */
  public static ipcOnCallResponse<T>(
    messages$: Observable<IProcessMessage<any>>,
    uid: number,
    args: any[],
    timeout: number,
  ): Observable<T> {
    return messages$
      .filter((message) => {
        // Filter by message type and identifier.
        if (message.type === EProcessMessageType.CallResponse) {
          const data: IProcessCallResponse<T> = message.data;
          return data.uid === uid;
        }
        return false;
      })
      .map((message) => message.data as IProcessCallResponse<T>)
      .timeout(timeout)
      .takeWhile((data) => {
        // Complete observable when complete message received.
        return !data.complete;
      })
      .mergeMap((data) => {
        // Throw error or emit next data.
        if (data.error != null) {
          const error = ChildProcess.ipcDeserialiseError(data.error);
          return Observable.throw(error);
        } else {
          return Observable.of(data.next);
        }
      });
  }

  /** Handle method call requests. */
  public static ipcOnCallRequest(
    emitter: IProcessSend,
    mod: Module,
    data: IProcessCallRequest,
  ): void {
    const type = EProcessMessageType.CallResponse;
    const responseData: IProcessCallResponse<any> = { uid: data.uid };

    try {
      // Retrieve target module and make subscribe call to method.
      const targetMod = mod.container.resolve<any>(data.target);
      const method: IProcessCall<any> = targetMod[data.method].bind(targetMod);

      method(...data.args)
        .subscribe({
          next: (next) => {
            const nextData = Object.assign({ next }, responseData);
            emitter.send(type, nextData);
          },
          error: (error) => {
            error = ChildProcess.ipcSerialiseError(error);
            const errorData = Object.assign({ error }, responseData);
            emitter.send(type, errorData);
          },
          complete: () => {
            const completeData = Object.assign({ complete: true }, responseData);
            emitter.send(type, completeData);
          },
        });

    } catch (error) {
      error = ChildProcess.ipcSerialiseError(error);
      const errorData = Object.assign({ error }, responseData);
      emitter.send(type, errorData);
    }
  }

  /** Observable stream of messages received via IPC. */
  public readonly messages$ = new Subject<IProcessMessage<any>>();

  /** Observable stream of events received via IPC. */
  public readonly events$ = new Subject<IProcessEvent<any>>();

  protected readonly childProcessIpcId = isString(this.environment.get(ChildProcess.ENV.IPC_ID));

  public constructor(options: IModuleOptions) {
    super(options);

    // Configure IPC and handle messages.
    ipc.config.appspace = `${this.title}.`;
    ipc.config.id = this.namespace;
    ipc.config.logger = Debug(`node-ipc:${this.namespace}`);
    ipc.connectTo(this.childProcessIpcId, () => {
      const emitter = ipc.of[this.childProcessIpcId];
      emitter.on("message", (data: any) => this.messages$.next(data));
    });
    this.messages$
      .subscribe((message) => this.childProcessIpcOnMessage(message));

    // Send status event on interval.
    Observable.interval(this.metricInterval)
      .subscribe(() => this.event<IProcessStatus>(ChildProcess.EVENT.STATUS, { data: this.status }));

    // Forward log and metric messages to parent process.
    this.container.logs$
      .subscribe((log) => this.send(EProcessMessageType.Log, log));
    this.container.metrics$
      .subscribe((metric) => this.send(EProcessMessageType.Metric, metric));
  }

  public moduleDestroy(): void {
    // Disconnect IPC client on process end.
    ipc.disconnect(this.childProcessIpcId);
  }

  /** Send message via IPC. */
  public send<T>(type: EProcessMessageType, data: IProcessMessageData<T>): void {
    const emitter = ipc.of[this.childProcessIpcId];
    const message: IProcessMessage<T> = { type, data };
    emitter.emit("message", message);
  }

  /** Send event with optional data via IPC. */
  public event<T>(name: string, options: IProcessEventOptions<T> = {}): void {
    ChildProcess.ipcSendEvent<T>(this, this, name, options);
  }

  /** Listen for event sent via IPC. */
  public listen<T>(name: string): Observable<T> {
    return ChildProcess.ipcListenForEvent<T>(this.events$, name);
  }

  /** Make call to module.method in parent process. */
  public call<T>(target: string, method: string, options: IProcessCallOptions = {}): Observable<T> {
    return ChildProcess.ipcSendCallRequest<T>(this, this, target, method, options);
  }

  /** Handle messages received from parent process. */
  protected childProcessIpcOnMessage(message: IProcessMessage<any>): void {
    switch (message.type) {
      // Send event on internal event bus.
      case EProcessMessageType.Event: {
        const event: IProcessEvent<any> = message.data;
        this.events$.next(event);
        break;
      }
      // Call request received from parent.
      case EProcessMessageType.CallRequest: {
        ChildProcess.ipcOnCallRequest(this, this, message.data);
        break;
      }
    }
  }

}
