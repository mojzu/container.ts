import * as constants from "../../constants";
import { IContainerOpts, IContainerDepends, ContainerModule, ContainerLogMessage, LogLevel } from "../../container";

export abstract class Log extends ContainerModule {

  private _level: LogLevel;

  protected get level(): LogLevel { return this._level; }

  public constructor(opts: IContainerOpts, name: string, depends?: IContainerDepends) {
    super(opts, name, depends);

    // Get log level from environment or fall back on default.
    const rawLevel = this.environment.get(constants.ENV_LOG_LEVEL) || constants.DEFAULT_LOG_LEVEL;
    this._level = this.parseLevel(rawLevel);
    this.debug(`level '${LogLevel[this.level]}'`);

    // Subscribe to container log messages filtered by level.
    this.container.getLogs(this.level)
      .subscribe((log) => this.handleLog(log));
  }

  /** Abstract handler for incoming log messages. */
  protected abstract handleLog(log: ContainerLogMessage): void;

  /** Convert environment log level string to level index, defaults to warning. */
  protected parseLevel(level?: string): LogLevel {
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
