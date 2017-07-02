/// <reference types="node" />
import * as process from "process";
import * as path from "path";
import * as constants from "./constants";
import { Container, Environment } from "./container";
import { Assets, Scripts, Log, RollbarLog } from "./modules";

// TODO: Command line argument support (minimist, argv).
// TODO: Variable log/data directories.
// TODO: Process signal handling.

// Create container and environment instances.
const container = new Container();
const environment = new Environment(process.env);

// Set scripts and assets directory paths in environment.
environment
  .set(constants.ENV_SCRIPTS, path.resolve(`${__dirname}/scripts`))
  .set(constants.ENV_ASSETS, path.resolve(`${__dirname}/../assets`));

// Populate container for dependency injection.
container
  .registerValue(constants.ENVIRONMENT, environment)
  .registerModule(constants.SCRIPTS, Scripts)
  .registerModule(constants.ASSETS, Assets);

// Register different modules based on environment.
const rollbarAccessToken = !!environment.get(constants.ENV_ROLLBAR_ACCESS_TOKEN);
container.registerModule(constants.LOG, rollbarAccessToken ? RollbarLog : Log);

// Run following section only if this is the main script.
// Signals container modules to start.
if (require.main === module) {
  container.up();
}
