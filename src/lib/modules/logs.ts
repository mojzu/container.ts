import { ContainerLogMessage, ELogLevel, IModuleOptions, Module } from "../../container";
import { ErrorChain } from "../error";
import { isString } from "../validate";

/** Logs environment variable names. */
export enum ELogsEnv {
  /** Application logs level (default warning). */
  Level = "LOGS_LEVEL"
}

/** Abstract container logs handler module. */
export abstract class Logs extends Module {
  /** Default module name. */
  public static readonly moduleName: string = "Logs";

  /**
   * Parsed application logs level.
   * Get log level from environment, defaults to warning.
   */
  protected readonly envLogsLevel = this.logsParseLevel(isString(this.environment.get(ELogsEnv.Level, "warning")));

  public constructor(options: IModuleOptions) {
    super(options);

    // Subscribe to container log messages filtered by level.
    this.container.filterLogs(this.envLogsLevel).subscribe((log) => this.logsOnMessage(log));
  }

  /** Abstract handler for incoming log messages. */
  protected abstract logsOnMessage(log: ContainerLogMessage): void;

  /**
   * Returns a new instance of ContainerLogMessage where message is a string.
   * Some logging libraries only accept strings, in case message is an error, message/name property
   * is used for log and other error properties are appended to log arguments array.
   */
  protected logsMessageAsString(log: ContainerLogMessage): ContainerLogMessage {
    let message = log.message;
    let args = log.args;

    // If log message is an error instance, use message string and
    // prepend error object to variable arguments.
    if (ErrorChain.isError(log.message)) {
      const error: Error | ErrorChain = log.message;
      message = error.message || error.name;
      args = [error].concat(log.args);
    }

    return new ContainerLogMessage(log.level, message, log.metadata, args);
  }

  /** Convert environment log level string to level index, defaults to warning. */
  protected logsParseLevel(level?: string): ELogLevel {
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
