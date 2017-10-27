import { Container, Environment } from "container.ts";
import { Assets, Scripts, ScriptsServer } from "container.ts/lib/node-modules";
import * as process from "process";
import { argv } from "yargs";
import * as constants from "./constants";
import { MainProcess, RollbarLogs, StatsdMetrics, WinstonLogs } from "./modules";

// Environment overrides provided by FuseBox.
declare const __process_env__: any;

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env, __process_env__);

// Get application values from environment or use defaults.
const STATSD_HOST = ENVIRONMENT.get(StatsdMetrics.ENV.HOST) || constants.DEFAULT_STATSD_HOST;

// Define application values in environment.
ENVIRONMENT
  .set(StatsdMetrics.ENV.HOST, STATSD_HOST);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Main", ENVIRONMENT, argv)
  .registerModule(MainProcess.NAME, MainProcess)
  .registerModule(Assets.NAME, Assets)
  .registerModule(Scripts.NAME, ScriptsServer)
  .registerModule(WinstonLogs.NAME, WinstonLogs)
  .registerModule(StatsdMetrics.NAME, StatsdMetrics);

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(RollbarLogs.ENV.ACCESS_TOKEN)) {
  CONTAINER.registerModule(RollbarLogs.NAME, RollbarLogs);
}

// Start container modules.
CONTAINER.start()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
