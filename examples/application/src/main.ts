/// <reference types="node" />
import * as process from "process";
import { Container, Environment } from "container.ts";
import { Validate } from "container.ts/lib/validate";
import { Asset, Process, Script } from "container.ts/modules";
import { StatsdMetric, WinstonLog, RollbarLog } from "./modules";
import * as constants from "./constants";

// TODO: Command line argument support (minimist, argv).
// TODO: Variable log/data directories.

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Get application values from environment or use defaults.
const NAME = Validate.isString(ENVIRONMENT.get(constants.ENV_NAME) || constants.DEFAULT_NAME);
const STATSD_HOST = ENVIRONMENT.get(StatsdMetric.ENV.HOST) || constants.DEFAULT_STATSD_HOST;

// Define application values in environment.
ENVIRONMENT
  .set(constants.ENV_NAME, NAME)
  .set(Asset.ENV.PATH, constants.DEFAULT_ASSET_PATH)
  .set(Script.ENV.PATH, constants.DEFAULT_SCRIPT_PATH)
  .set(StatsdMetric.ENV.HOST, STATSD_HOST);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(Process)
  .registerModule(Script)
  .registerModule(WinstonLog)
  .registerModule(StatsdMetric);

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(RollbarLog.ENV.ACCESS_TOKEN)) {
  CONTAINER.registerModule(RollbarLog);
}

// Start container modules.
if (require.main === module) {
  CONTAINER.start()
    .subscribe({
      error: (error) => {
        process.stderr.write(`${error}\n`);
        process.exit(1);
      },
    });
}
