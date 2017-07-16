import * as winston from "winston";
import { IContainerModuleOpts, ContainerLogMessage, ELogLevel } from "../../container";
import { Log } from "./Log";

export class WinstonLog extends Log {

  private _logger: winston.LoggerInstance;

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

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
    const callback = this.handleError.bind(this);
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
      case ELogLevel.Emergency: {
        this._logger.emerg(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Alert: {
        this._logger.alert(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Critical: {
        this._logger.crit(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Error: {
        this._logger.error(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Warning: {
        this._logger.warning(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Notice: {
        this._logger.notice(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Informational: {
        this._logger.info(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Debug: {
        this._logger.debug(message, log.metadata, ...log.args, callback);
        break;
      }
    }
  }

  /** Winston error handler callback. */
  protected handleError(error?: any): void {
    if (error != null) {
      process.stderr.write(String(error));
    }
  }

}
