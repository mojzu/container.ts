import { ContainerLogMessage, ELogLevel, IModuleDependencies, IModuleOpts } from "container.ts";
import { Logs } from "container.ts/lib/node-modules";
import { Validate } from "container.ts/lib/validate";
import * as Rollbar from "rollbar";
import { MainProcess } from "./MainProcess";

export class RollbarLogs extends Logs {

  public static readonly NAME: string = "Rollbar";

  /** Environment variable names. */
  public static ENV = Object.assign(Logs.ENV, {
    /** Rollbar access token (required). */
    ACCESS_TOKEN: "ROLLBAR_ACCESS_TOKEN",
    /** Rollbar report level (default error). */
    REPORT_LEVEL: "ROLLBAR_REPORT_LEVEL",
  });

  public get dependencies(): IModuleDependencies {
    return { process: MainProcess.NAME };
  }

  private readonly process: MainProcess;
  private readonly rollbar: Rollbar;

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Get access token from environment.
    // Get report level from environment or fall back on log level.
    const accessToken = Validate.isString(this.environment.get(RollbarLogs.ENV.ACCESS_TOKEN));
    const rawReportLevel = Validate.isString(this.environment.get(RollbarLogs.ENV.REPORT_LEVEL) || "error");
    const reportLevel = this.reportLevel(rawReportLevel);
    this.debug(`${RollbarLogs.ENV.REPORT_LEVEL}="${reportLevel}"`);

    // Create Rollbar instance.
    // Report level determined by module log level.
    // Handle uncaught exceptions and unhandled rejections by default.
    // Uncaught errors have 'critical' level by default.
    this.rollbar = new Rollbar({
      accessToken,
      version: this.process.version,
      reportLevel,
      uncaughtErrorLevel: "critical",
      captureUncaught: true,
      captureUnhandledRejections: true,
    });
  }

  /** Rollbar handler for incoming log messages. */
  protected handleLog(log: ContainerLogMessage): void {
    const callback = this.handleError.bind(this);

    // Map log level to rollbar log methods.
    switch (log.level) {
      case ELogLevel.Emergency:
      case ELogLevel.Alert:
      case ELogLevel.Critical: {
        this.rollbar.critical(log.message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Error: {
        this.rollbar.error(log.message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Warning: {
        this.rollbar.warning(log.message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Notice:
      case ELogLevel.Informational: {
        this.rollbar.info(log.message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Debug: {
        this.rollbar.debug(log.message, log.metadata, ...log.args, callback);
        break;
      }
    }
  }

  /** Rollbar error handler callback. */
  protected handleError(error?: any): void {
    if (error != null) {
      process.stderr.write(String(error));
    }
  }

  /** Return rollbar report level. */
  protected reportLevel(value: string) {
    const level = this.parseLevel(value);
    switch (level) {
      case ELogLevel.Emergency:
      case ELogLevel.Alert:
      case ELogLevel.Critical: {
        return "critical";
      }
      case ELogLevel.Error: {
        return "error";
      }
      case ELogLevel.Warning: {
        return "warning";
      }
      case ELogLevel.Notice:
      case ELogLevel.Informational: {
        return "info";
      }
      case ELogLevel.Debug: {
        return "debug";
      }
      default: {
        return "error";
      }
    }
  }

}
