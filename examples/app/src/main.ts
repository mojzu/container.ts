/// <reference types="node" />
import { Container, Environment } from "container.ts";
import { Asset, Script, ScriptManagerFactory } from "container.ts/lib/node-modules";
import * as process from "process";
import * as constants from "./constants";
import { MainProcess, RollbarLog, StatsdMetric, WinstonLog } from "./modules";

// TODO: Command line argument support (minimist, argv).
// TODO: Variable log/data directories.

// Environment overrides provided by FuseBox.
declare const __process_env__: any;

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(Object.assign(process.env, __process_env__ || {}));

// Get application values from environment or use defaults.
const STATSD_HOST = ENVIRONMENT.get(StatsdMetric.ENV.HOST) || constants.DEFAULT_STATSD_HOST;

// Define application values in environment.
ENVIRONMENT
  .set(StatsdMetric.ENV.HOST, STATSD_HOST);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Main", ENVIRONMENT)
  .registerModule(MainProcess.NAME, MainProcess)
  .registerModule(Asset.NAME, Asset)
  .registerModule(Script.NAME, Script)
  .registerModule(WinstonLog.NAME, WinstonLog)
  .registerModule(StatsdMetric.NAME, StatsdMetric)
  .registerModule("Scripts", ScriptManagerFactory.create([
    { name: "server.js", uptimeLimit: "T1M" },
  ]));

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(RollbarLog.ENV.ACCESS_TOKEN)) {
  CONTAINER.registerModule(RollbarLog.NAME, RollbarLog);
}

// Start container modules.
CONTAINER.start()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
