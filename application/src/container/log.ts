
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
  public emergency(...args: any[]): void {
    return this.log(LogLevel.Emergency, args);
  }

  /** Action must be taken immediately. */
  public alert(...args: any[]): void {
    return this.log(LogLevel.Alert, args);
  }

  /** Critical conditions. */
  public critical(...args: any[]): void {
    return this.log(LogLevel.Critical, args);
  }

  /** Error conditions. */
  public error(...args: any[]): void {
    return this.log(LogLevel.Error, args);
  }

  /** Warning conditions. */
  public warn(...args: any[]): void {
    return this.log(LogLevel.Warning, args);
  }

  /** Normal but significant condition. */
  public notice(...args: any[]): void {
    return this.log(LogLevel.Notice, args);
  }

  /** Informational messages */
  public info(...args: any[]): void {
    return this.log(LogLevel.Informational, args);
  }

  /** Debug level messages. */
  public debug(...args: any[]): void {
    return this.log(LogLevel.Debug, args);
  }

  /** Log method provided by implementor. */
  protected abstract log(level: LogLevel, args: any[]): void;

}
