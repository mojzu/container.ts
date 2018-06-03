import { ContainerLogMessage } from "container.ts";
import { ErrorChain } from "container.ts/lib/error";
import { Logs } from "container.ts/lib/node/modules";
import { get } from "lodash";
import * as winston from "winston";

/** Winston module error wrapper. */
export class WinstonLogsError extends ErrorChain {
  public constructor(cause?: Error) {
    super({ name: "WinstonLogsError" }, cause);
  }
}

/**
 * Winston module.
 * <https://github.com/winstonjs/winston>
 */
export class WinstonLogs extends Logs {
  public static readonly moduleName: string = "WinstonLogs";

  /** Container log levels to syslog levels. */
  public static readonly syslogLevels = [
    "emerg", // Emergency
    "alert", // Alert
    "crit", // Critical
    "error", // Error
    "warning", // Warning
    "notice", // Notice
    "info", // Informational
    "debug" // Debug
  ];

  /** Winston logger instance. */
  protected readonly logger = new winston.Logger({
    ...winston.config.syslog,
    transports: [
      new winston.transports.Console({
        level: "debug",
        colorize: true,
        prettyPrint: true
      })
    ]
  });

  /** Winston handler for incoming log messages. */
  protected logsOnMessage(log: ContainerLogMessage): void {
    let message: string;
    let args = log.args;

    // Winston only accepts string messages.
    // If log message is an error instance, use message string and
    // prepend error object to variable arguments.
    if (ErrorChain.isError(log.message)) {
      const error: Error | ErrorChain = log.message;
      message = error.message || error.name;
      args = [error].concat(log.args);
    } else {
      message = log.message;
    }

    // Log message with level.
    const level = get(WinstonLogs.syslogLevels, log.level, "emerg");
    this.logger.log(level, message, log.metadata, ...args, (error: any) => this.onError(error));
  }

  /**
   * Winston internal error callback.
   * Writes directly to stderr, logging here could cause loop.
   */
  protected onError(error?: any): void {
    if (error != null) {
      process.stderr.write(String(new WinstonLogsError(error)));
    }
  }
}
