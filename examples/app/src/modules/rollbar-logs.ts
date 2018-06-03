import { ContainerLogMessage, ELogLevel, IModuleDependencies, IModuleOptions } from "container.ts";
import { Logs, Process } from "container.ts/lib/node/modules";
import { isString } from "container.ts/lib/validate";
import * as rollbar from "rollbar";

export enum ERollbarLogsEnv {
  /** Rollbar access token (required). */
  AccessToken = "ROLLBAR_ACCESS_TOKEN",
  /** Rollbar report level (default error). */
  ReportLevel = "ROLLBAR_REPORT_LEVEL"
}

export class RollbarLogs extends Logs {
  public static readonly moduleName: string = "Rollbar";

  protected readonly process!: Process;
  protected readonly rollbar: rollbar;

  public constructor(options: IModuleOptions) {
    super(options);

    // Get access token from environment.
    // Get report level from environment or fall back on log level.
    const accessToken = isString(this.environment.get(ERollbarLogsEnv.AccessToken));
    const rawReportLevel = isString(this.environment.get(ERollbarLogsEnv.ReportLevel) || "error");
    const reportLevel = this.reportLevel(rawReportLevel);
    this.debug(`${ERollbarLogsEnv.ReportLevel}="${reportLevel}"`);

    // Create Rollbar instance.
    // Report level determined by module log level.
    // Handle uncaught exceptions and unhandled rejections by default.
    // Uncaught errors have 'critical' level by default.
    this.rollbar = new rollbar({
      accessToken,
      version: this.process.envVersion,
      reportLevel,
      uncaughtErrorLevel: "critical",
      captureUncaught: true,
      captureUnhandledRejections: true
    });
  }

  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { process: Process });
  }

  /** Rollbar handler for incoming log messages. */
  protected logsOnMessage(log: ContainerLogMessage): void {
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
    const level = this.logsParseLevel(value);
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
