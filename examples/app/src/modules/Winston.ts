import { ContainerLogMessage, ELogLevel, IModuleOpts } from "container.ts";
import { ErrorChain } from "container.ts/lib/error";
import { Logs } from "container.ts/lib/node-modules";
import * as winston from "winston";

export class Winston extends Logs {

  public static readonly moduleName: string = "Winston";

  protected readonly logger: winston.LoggerInstance;

  public constructor(opts: IModuleOpts) {
    super(opts);

    // Construct Winston logger with console transport.
    this.logger = new winston.Logger({
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
  protected onMessage(log: ContainerLogMessage): void {
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
        this.logger.emerg(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Alert: {
        this.logger.alert(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Critical: {
        this.logger.crit(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Error: {
        this.logger.error(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Warning: {
        this.logger.warning(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Notice: {
        this.logger.notice(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Informational: {
        this.logger.info(message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Debug: {
        this.logger.debug(message, log.metadata, ...log.args, callback);
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
