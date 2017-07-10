import * as constants from "../../constants";
import {
  IContainerModuleOpts,
  IContainerModuleDepends,
  ContainerModule,
  ContainerLogMessage,
  ELogLevel,
} from "../../container";

export abstract class Log extends ContainerModule {

  private _level: ELogLevel;

  protected get level(): ELogLevel { return this._level; }

  public constructor(name: string, opts: IContainerModuleOpts, depends?: IContainerModuleDepends) {
    super(name, opts, depends);

    // Get log level from environment or fall back on default.
    const rawLevel = this.environment.get(constants.ENV_LOG_LEVEL) || constants.DEFAULT_LOG_LEVEL;
    this._level = this.parseLevel(rawLevel);
    this.debug(`level '${ELogLevel[this.level]}'`);

    // Subscribe to container log messages filtered by level.
    this.container.getLogs(this.level)
      .subscribe((log) => this.handleLog(log));
  }

  /** Abstract handler for incoming log messages. */
  protected abstract handleLog(log: ContainerLogMessage): void;

  /** Convert environment log level string to level index, defaults to warning. */
  protected parseLevel(level?: string): ELogLevel {
    switch ((level || "").toLowerCase()) {
      case "emerg":
      case "emergency": {
        return ELogLevel.Emergency;
      }
      case "alert": {
        return ELogLevel.Alert;
      }
      case "crit":
      case "critical": {
        return ELogLevel.Critical;
      }
      case "err":
      case "error": {
        return ELogLevel.Error;
      }
      case "warn":
      case "warning": {
        return ELogLevel.Warning;
      }
      case "notice": {
        return ELogLevel.Notice;
      }
      case "info":
      case "information":
      case "informational": {
        return ELogLevel.Informational;
      }
      case "debug": {
        return ELogLevel.Debug;
      }
      default: {
        return ELogLevel.Warning;
      }
    }
  }

}
