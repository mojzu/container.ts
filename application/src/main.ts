/// <reference types="node" />
import * as process from "process";
import * as Debug from "debug";
import * as constants from "./constants";
import { Container, Environment } from "./container";
import { Assets, Scripts, RollbarLog } from "./modules";

// TODO: Command line argument support (minimist, argv).
// TODO: Variable log/data directories.
// TODO: Process signal handling.

// Create environment instance using process.
const ENVIRONMENT = new Environment(process.env);

// Get application environment, name and log level from environment or defaults.
const NODE_ENV = ENVIRONMENT.getDefault(constants.ENV_NODE_ENV, constants.DEFAULT_NODE_ENV);
const NAME = ENVIRONMENT.getDefault(constants.ENV_NAME, constants.DEFAULT_NAME);
const LOG_LEVEL = ENVIRONMENT.getDefault(constants.ENV_LOG_LEVEL, constants.DEFAULT_LOG_LEVEL);

// Set application values in environment.
ENVIRONMENT
  .set(constants.ENV_NODE_ENV, NODE_ENV)
  .set(constants.ENV_NAME, NAME)
  .set(constants.ENV_LOG_LEVEL, LOG_LEVEL)
  .set(constants.ENV_SCRIPTS, constants.DEFAULT_SCRIPTS)
  .set(constants.ENV_ASSETS, constants.DEFAULT_ASSETS);

// Create container instance with name.
const CONTAINER = new Container(NAME);

// Populate container for dependency injection.
CONTAINER
  .registerValue(constants.ENVIRONMENT, ENVIRONMENT)
  .registerModule(constants.SCRIPTS, Scripts)
  .registerModule(constants.ASSETS, Assets);

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(constants.ENV_ROLLBAR_ACCESS_TOKEN)) {
  CONTAINER.registerModule(constants.LOG, RollbarLog);
}

// Run following section only if this is the main script.
// Signals container modules to start.
if (require.main === module) {
  // Create debug instance for script.
  const debug = Debug(NAME);
  debug("up");

  CONTAINER.up();
}
