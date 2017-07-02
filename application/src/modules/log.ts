import * as process from "process";
import * as constants from "../constants";
import { IContainerOpts, ContainerModule, ContainerLogMessage, Environment, LogLevel } from "../container";

export class Log extends ContainerModule {

  private _environment: Environment;
  private _level: LogLevel;

  /** Log level configured by environment. */
  public get level(): LogLevel { return this._level; }

  public constructor(opts: IContainerOpts) {
    super(opts, constants.LOG, {
      _environment: constants.ENVIRONMENT,
    });

    // Get log level from environment.
    this._level = this.parseLogLevel(this._environment.get(constants.ENV_LOG_LEVEL));
    this.debug(`level '${LogLevel[this.level]}'`);

    // Subscribe to container log messages filtered by level.
    this.container.getLogs(this.level)
      .subscribe((log) => this.handleLog(log));
  }

  /** Default handler for incoming log messages. */
  protected handleLog(log: ContainerLogMessage): void {
    process.stdout.write(`${log.toString()}\n`);
  }

  /** Convert environment log level string to level index, defaults to warning. */
  protected parseLogLevel(level?: string): LogLevel {
    switch ((level || "").toLowerCase()) {
      case "emerg":
      case "emergency": {
        return LogLevel.Emergency;
      }
      case "alert": {
        return LogLevel.Alert;
      }
      case "crit":
      case "critical": {
        return LogLevel.Critical;
      }
      case "err":
      case "error": {
        return LogLevel.Error;
      }
      case "warn":
      case "warning": {
        return LogLevel.Warning;
      }
      case "notice": {
        return LogLevel.Notice;
      }
      case "info":
      case "information":
      case "informational": {
        return LogLevel.Informational;
      }
      case "debug": {
        return LogLevel.Debug;
      }
      default: {
        return LogLevel.Warning;
      }
    }
  }

}
