import { IContainerLogMessage, IContainerMetricMessage } from "../../container";
import { IErrorChainSerialised } from "../error";
import { Observable } from "./RxJS";

/** Process message types. */
export enum EProcessMessageType {
  Log,
  Metric,
  Event,
  CallRequest,
  CallResponse,
}

/** Process event method options. */
export interface IProcessEventOptions<T> {
  data?: T;
}

/** Process event message data. */
export interface IProcessEvent<T> {
  name: string;
  data?: T;
}

/** Process call method options. */
export interface IProcessCallOptions {
  timeout?: number;
  args?: any[];
}

/** Process call function signature. */
export type IProcessCall<T> = (...args: any[]) => Observable<T>;

/** Process call target data. */
export interface IProcessCallTarget {
  process: string;
  module: string;
  method: string;
  uid: number;
}

/** Process call request message data. */
export interface IProcessCallRequest {
  target: IProcessCallTarget;
  args: any[];
}

/** Process call response message data. */
export interface IProcessCallResponse<T> {
  target: IProcessCallTarget;
  next?: T;
  error?: IErrorChainSerialised;
  complete?: boolean;
}

/** Process message data types union. */
export type IProcessMessageData<T> = IContainerLogMessage
  | IContainerMetricMessage
  | IProcessEvent<T>
  | IProcessCallRequest
  | IProcessCallResponse<T>;

/** Process message type. */
export interface IProcessMessage<T> extends Object {
  type: EProcessMessageType;
  data: IProcessMessageData<T>;
}

/** Process accumulated exit callback return value(s). */
export type IProcessExit = [number | null, string | null];
