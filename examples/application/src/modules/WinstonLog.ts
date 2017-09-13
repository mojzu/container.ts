/// <reference types="node" />
import * as winston from "winston";
import { IContainerModuleOpts, ContainerLogMessage, ELogLevel } from "container.ts";
import { ErrorChain } from "container.ts/lib/error";
import { Log } from "container.ts/modules";

export class WinstonLog extends Log {

  private _logger: winston.LoggerInstance;

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Construct Winston logger with console transport.
    this._logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          level: "debug",
          colorize: true,
          prettyPrint: true,
        }),
      ],
    });
  }

  /** Winston handler for incoming log messages. */
  protected handleLog(log: ContainerLogMessage): void {
    const callback = this.handleError.bind(this);
    let message: string;

    // If log message is an error instance, use message string
    // and prepend error object to arguments.
    if (ErrorChain.isError(log.message)) {
      const error: Error | ErrorChain = log.message as any;
      message = error.message || error.name;
      log.args = [error].concat(log.args);
    } else {
      message = log.message as any;
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
