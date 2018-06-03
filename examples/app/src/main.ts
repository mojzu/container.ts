import { Container, Environment, IEnvironmentVariables } from "container.ts";
import { Assets, Process, Scripts } from "container.ts/lib/node/modules";
import * as process from "process";
import { argv } from "yargs";
import { ERollbarLogsEnv, Main, RollbarLogs, StatsdMetrics, WinstonLogs } from "./modules";

// Environment variables provided by FuseBox build.
// Fallback to empty if not defined.
declare const __process_env__: IEnvironmentVariables;
let fuseBoxEnvironment: IEnvironmentVariables;
try {
  fuseBoxEnvironment = __process_env__;
} catch (error) {
  fuseBoxEnvironment = {};
}

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(fuseBoxEnvironment, process.env);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Main", ENVIRONMENT, argv).registerModules([
  Process,
  Assets,
  Scripts,
  Main,
  StatsdMetrics,
  WinstonLogs
]);

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(ERollbarLogsEnv.AccessToken)) {
  CONTAINER.registerModule(RollbarLogs);
}

// Signal operational.
CONTAINER.up().subscribe({
  next: () => {
    // Modules counter.
    CONTAINER.debug(`${CONTAINER.moduleNames.length} modules started`);
  },
  error: (error) => {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  }
});
