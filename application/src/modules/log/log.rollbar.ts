import * as assert from "assert";
import * as constants from "../../constants";
import { IContainerModuleOpts, ContainerLogMessage, ELogLevel } from "../../container";
import { Log } from "./log";

// Rollbar does not have defined types.
const Rollbar: any = require("rollbar");

export class RollbarLog extends Log {

  private _rollbar: any;

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get Node environment value.
    const environment = this.environment.get(constants.ENV_NODE_ENV) || constants.DEFAULT_NODE_ENV;
    this.debug(`environment '${environment}'`);

    // Get access token from environment.
    const accessToken = this.environment.get(constants.ENV_ROLLBAR_ACCESS_TOKEN);
    assert(accessToken != null, "Rollbar access token is undefined");

    // Get report level from environment or fall back on log level.
    const rawReportLevel = this.environment.get(constants.ENV_ROLLBAR_REPORT_LEVEL);
    const reportLevel = this.reportLevel(rawReportLevel);
    this.debug(`reportLevel '${reportLevel}'`);

    // Create Rollbar instance.
    // Report level determined by module log level.
    // Handle uncaught exceptions and unhandled rejections by default.
    // Uncaught errors have 'critical' level by default.
    this._rollbar = new Rollbar({
      environment,
      accessToken,
      reportLevel,
      handleUncaughtExceptions: true,
      handleUnhandledRejections: true,
      uncaughtErrorLevel: "critical",
    });
  }

  /** Rollbar handler for incoming log messages. */
  protected handleLog(log: ContainerLogMessage): void {
    const callback = this.handlerError.bind(this);

    // Map log level to rollbar log methods.
    switch (log.level) {
      case ELogLevel.Emergency:
      case ELogLevel.Alert:
      case ELogLevel.Critical: {
        this._rollbar.critical(log.message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Error: {
        this._rollbar.error(log.message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Warning: {
        this._rollbar.warning(log.message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Notice:
      case ELogLevel.Informational: {
        this._rollbar.info(log.message, log.metadata, ...log.args, callback);
        break;
      }
      case ELogLevel.Debug: {
        this._rollbar.debug(log.message, log.metadata, ...log.args, callback);
        break;
      }
    }
  }

  /** Rollbar error handler callback. */
  protected handlerError(error?: any): void {
    if (error != null) {
      process.stderr.write(String(error));
    }
  }

  /** Return rollbar report level. */
  protected reportLevel(value?: string): string {
    let level: ELogLevel;

    if (value != null) {
      level = this.parseLevel(value);
    } else {
      level = this.level;
    }

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
