import * as assert from "assert";
import * as constants from "../constants";
import { IContainerOpts, ContainerLogMessage, LogLevel } from "../container";
import { Log } from "./log";

// Rollbar does not have defined types.
const Rollbar: any = require("rollbar");

export class RollbarLog extends Log {

  private _rollbar: any;

  /** Convert internal log level to rollbar report level. */
  protected get reportLevel(): string {
    switch (this.level) {
      case LogLevel.Emergency:
      case LogLevel.Alert:
      case LogLevel.Critical: {
        return "critical";
      }
      case LogLevel.Error: {
        return "error";
      }
      case LogLevel.Warning: {
        return "warning";
      }
      case LogLevel.Notice:
      case LogLevel.Informational: {
        return "info";
      }
      case LogLevel.Debug: {
        return "debug";
      }
      default: {
        return "error";
      }
    }
  }

  public constructor(opts: IContainerOpts) {
    super(opts);

    // Get access token from environment.
    const accessToken = this.environment.get(constants.ENV_ROLLBAR_ACCESS_TOKEN);
    assert(accessToken != undefined, "Rollbar access token is undefined");

    // Get Node environment.
    // TODO: Validate environment value.
    const environment = this.environment.get(constants.ENV_NODE_ENV) || "development";
    this.debug(`environment '${environment}'`);

    // Create Rollbar instance.
    // Report level determined by module log level.
    // Handle uncaught exceptions and unhandled rejections by default.
    // Uncaugh errors have 'critical' level by default.
    this._rollbar = new Rollbar({
      accessToken,
      reportLevel: this.reportLevel,
      handleUncaughtExceptions: true,
      handleUnhandledRejections: true,
      uncaughtErrorLevel: "critical",
      payload: {
        environment,
      },
    });
  }

  protected handleLog(log: ContainerLogMessage): void {
    // Add module name to payload data.
    this._rollbar.configure({ payload: { moduleName: log.moduleName } });

    // Map log level to rollbar log methods.
    const callback = this.logCallback.bind(this);
    switch (log.level) {
      case LogLevel.Emergency:
      case LogLevel.Alert:
      case LogLevel.Critical: {
        this._rollbar.critical(...log.args, callback);
        break;
      }
      case LogLevel.Error: {
        this._rollbar.error(...log.args, callback);
        break;
      }
      case LogLevel.Warning: {
        this._rollbar.warning(...log.args, callback);
        break;
      }
      case LogLevel.Notice:
      case LogLevel.Informational: {
        this._rollbar.info(...log.args, callback);
        break;
      }
      case LogLevel.Debug: {
        this._rollbar.debug(...log.args, callback);
        break;
      }
    }
  }

  protected logCallback(error?: Error): void {
    // TODO: Improve error handling.
    if (error != undefined) {
      this.debug(error);
    }
  }

}
