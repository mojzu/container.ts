import { ContainerLogMessage, ELogLevel, IModuleOpts, Module } from "../../container";
import { Validate } from "../validate";

export abstract class Logs extends Module {

  /** Default module name. */
  public static readonly NAME: string = "Logs";

  /** Environment variable names. */
  public static readonly ENV = {
    /** Application logs level (default warning). */
    LEVEL: "LOGS_LEVEL",
  };

  /** Parsed application logs level. */
  protected readonly level = this.parseLevel(this.envLevel);

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Debug environment variables.
    this.debug(`${Logs.ENV.LEVEL}="${ELogLevel[this.level]}"`);

    // Subscribe to container log messages filtered by level.
    this.container.filterLogs(this.level)
      .subscribe((log) => this.onMessage(log));
  }

  /** Abstract handler for incoming log messages. */
  protected abstract onMessage(log: ContainerLogMessage): void;

  /** Get log level from environment or default to warning. */
  protected get envLevel(): string {
    return Validate.isString(this.environment.get(Logs.ENV.LEVEL) || "warning");
  }

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
