import * as process from "process";
import { Container, Environment } from "container.ts";
import {
  ENV_ASSET_PATH,
  ENV_SCRIPT_PATH,
  ENV_ROLLBAR_ACCESS_TOKEN,
  ENV_STATSD_HOST,
  Asset,
  Process,
  Script,
  WinstonLog,
  RollbarLog,
  StatsdMetric,
} from "container.ts/modules";
import * as constants from "./constants";

// TODO: Command line argument support (minimist, argv).
// TODO: Variable log/data directories.

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Get application name from environment or use default.
const NAME = ENVIRONMENT.get(constants.ENV_NAME) || constants.DEFAULT_NAME;

// Set application values in environment.
ENVIRONMENT
  .set(constants.ENV_NAME, NAME)
  .set(ENV_ASSET_PATH, constants.DEFAULT_ASSET_PATH)
  .set(ENV_SCRIPT_PATH, constants.DEFAULT_SCRIPT_PATH);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(Process)
  .registerModule(Script)
  .registerModule(WinstonLog);

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(ENV_ROLLBAR_ACCESS_TOKEN)) {
  CONTAINER.registerModule(RollbarLog);
}
if (!!ENVIRONMENT.get(ENV_STATSD_HOST)) {
  CONTAINER.registerModule(StatsdMetric);
}

// Run following section if this is the main script.
if (require.main === module) {
  // Start container modules.
  CONTAINER.start()
    .subscribe({
      error: (error) => process.stderr.write(error),
    });
}
