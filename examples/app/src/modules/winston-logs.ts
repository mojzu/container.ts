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

  /** Logger colour options. */
  public static readonly syslogColours = {
    emerg: "red",
    alert: "red",
    crit: "red",
    error: "red",
    warning: "yellow",
    notice: "blue",
    info: "white",
    debug: "grey"
  };

  /** Winston logger instance. */
  protected readonly logger = winston.createLogger({
    levels: WinstonLogs.syslogLevels.reduce((previous, current, index) => ({ ...previous, [current]: index }), {}),
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({
        level: "debug",
        format: winston.format.combine(winston.format.colorize(WinstonLogs.syslogColours), winston.format.simple())
      })
    ]
  });

  /** Winston handler for incoming log messages. */
  protected logsOnMessage(log: ContainerLogMessage): void {
    // Winston only accepts string messages, use utility method.
    log = this.logsMessageAsString(log);

    // Log message with level.
    const level = get(WinstonLogs.syslogLevels, log.level, "emerg");
    this.logger.log(level, log.message as string, log.metadata, ...log.args, (error: any) => this.onError(error));
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
