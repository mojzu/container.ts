
/** Log levels defined in RFC5424. */
export enum LogLevel {
  Emergency,
  Alert,
  Critical,
  Error,
  Warning,
  Notice,
  Informational,
  Debug,
}

/** Log message types. */
export type ILogMessage = string | Error;

/** Log metadata type. */
export interface ILogMetadata extends Object {
  [key: string]: any;
}

/** Abstract log class. */
export abstract class Log {

  /** System is unusable. */
  public emergency(message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    return this.log(LogLevel.Emergency, message, metadata, ...args);
  }

  /** Action must be taken immediately. */
  public alert(message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    return this.log(LogLevel.Alert, message, metadata, ...args);
  }

  /** Critical conditions. */
  public critical(message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    return this.log(LogLevel.Critical, message, metadata, ...args);
  }

  /** Error conditions. */
  public error(message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    return this.log(LogLevel.Error, message, metadata, ...args);
  }

  /** Warning conditions. */
  public warn(message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    return this.log(LogLevel.Warning, message, metadata, ...args);
  }

  /** Normal but significant condition. */
  public notice(message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    return this.log(LogLevel.Notice, message, metadata, ...args);
  }

  /** Informational messages */
  public info(message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    return this.log(LogLevel.Informational, message, metadata, ...args);
  }

  /** Debug level messages. */
  public debug(message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void {
    return this.log(LogLevel.Debug, message, metadata, ...args);
  }

  /** Log method provided by implementor. */
  protected abstract log(level: LogLevel, message: ILogMessage, metadata?: ILogMetadata, ...args: any[]): void;

}
