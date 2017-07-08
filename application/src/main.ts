import * as process from "process";
import * as constants from "./constants";
import { Container, Environment } from "./container";
import { Assets, Process, Scripts, RollbarLog, WinstonLog } from "./modules";

// TODO: Command line argument support (minimist, argv).
// TODO: Variable log/data directories.

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Get application environment, name and log level from environment or use defaults.
const NODE_ENV = ENVIRONMENT.get(constants.ENV_NODE_ENV) || constants.DEFAULT_NODE_ENV;
const NAME = ENVIRONMENT.get(constants.ENV_NAME) || constants.DEFAULT_NAME;
const LOG_LEVEL = ENVIRONMENT.get(constants.ENV_LOG_LEVEL) || constants.DEFAULT_LOG_LEVEL;

// Set application values in environment.
ENVIRONMENT
  .set(constants.ENV_NODE_ENV, NODE_ENV)
  .set(constants.ENV_NAME, NAME)
  .set(constants.ENV_LOG_LEVEL, LOG_LEVEL)
  .set(constants.ENV_SCRIPTS, constants.DEFAULT_SCRIPTS)
  .set(constants.ENV_ASSETS, constants.DEFAULT_ASSETS);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(constants.ASSETS, Assets)
  .registerModule(constants.PROCESS, Process)
  .registerModule(constants.SCRIPTS, Scripts)
  .registerModule(constants.WINSTON_LOG, WinstonLog);

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(constants.ENV_ROLLBAR_ACCESS_TOKEN)) {
  CONTAINER.registerModule(constants.ROLLBAR_LOG, RollbarLog);
}

// Run following section if this is the main script.
if (require.main === module) {
  // Start container modules.
  CONTAINER.start()
    .subscribe({
      error: (error) => process.stderr.write(error),
    });
}
