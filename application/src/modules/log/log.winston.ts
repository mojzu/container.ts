import * as winston from "winston";
import { IContainerOpts, ContainerLogMessage, LogLevel } from "../../container";
import { Log } from "./log";

export class WinstonLog extends Log {

  private _logger: winston.LoggerInstance;

  public constructor(opts: IContainerOpts, name: string) {
    super(opts, name);

    // Construct Winston logger with console transport.
    // TODO: Optional file transport.
    this._logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
        }),
      ],
    });
  }

  /** Winston handler for incoming log messages. */
  protected handleLog(log: ContainerLogMessage): void {
    const callback = this.logCallback.bind(this);
    let message: string;

    // If log message is an Error instance, use message string
    // and prepend error object to arguments.
    if (log.message instanceof Error) {
      message = log.message.message || log.message.name;
      log.args = [log.message].concat(log.args);
    } else {
      message = log.message;
    }

    // Map log level to winston log methods.
    switch (log.level) {
      case LogLevel.Emergency: {
        this._logger.emerg(message, log.metadata, ...log.args, callback);
        break;
      }
      case LogLevel.Alert: {
        this._logger.alert(message, log.metadata, ...log.args, callback);
        break;
      }
      case LogLevel.Critical: {
        this._logger.crit(message, log.metadata, ...log.args, callback);
        break;
      }
      case LogLevel.Error: {
        this._logger.error(message, log.metadata, ...log.args, callback);
        break;
      }
      case LogLevel.Warning: {
        this._logger.warning(message, log.metadata, ...log.args, callback);
        break;
      }
      case LogLevel.Notice: {
        this._logger.notice(message, log.metadata, ...log.args, callback);
        break;
      }
      case LogLevel.Informational: {
        this._logger.info(message, log.metadata, ...log.args, callback);
        break;
      }
      case LogLevel.Debug: {
        this._logger.debug(message, log.metadata, ...log.args, callback);
        break;
      }
    }
  }

  /** Winston log callback. */
  protected logCallback(error?: Error): void {
    if (error != null) {
      this.debug(error);
    }
  }

}
