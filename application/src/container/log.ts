
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

/** Abstract logger class. */
export abstract class Logger {

  /** System is unusable. */
  public emergency(message: string, ...args: any[]): void {
    return this.log(LogLevel.Emergency, message, args);
  }

  /** Action must be taken immediately. */
  public alert(message: string, ...args: any[]): void {
    return this.log(LogLevel.Alert, message, args);
  }

  /** Critical conditions. */
  public critical(message: string, ...args: any[]): void {
    return this.log(LogLevel.Critical, message, args);
  }

  /** Error conditions. */
  public error(message: string, ...args: any[]): void {
    return this.log(LogLevel.Error, message, args);
  }

  /** Warning conditions. */
  public warn(message: string, ...args: any[]): void {
    return this.log(LogLevel.Warning, message, args);
  }

  /** Normal but significant condition. */
  public notice(message: string, ...args: any[]): void {
    return this.log(LogLevel.Notice, message, args);
  }

  /** Informational messages */
  public info(message: string, ...args: any[]): void {
    return this.log(LogLevel.Informational, message, args);
  }

  /** Debug level messages. */
  public debug(message: string, ...args: any[]): void {
    return this.log(LogLevel.Debug, message, args);
  }

  /** Log method provided by implementor. */
  protected abstract log(level: LogLevel, message: string, args: any[]): void;

}
