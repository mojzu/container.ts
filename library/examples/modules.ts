import * as process from "process";
import { Container, Environment } from "../container";
import {
  ENV_ASSET_PATH,
  Asset,
  Process,
  ENV_SCRIPT_PATH,
  Script,
  WinstonLog,
  ENV_STATSD_HOST,
  StatsdMetric,
} from "../modules";

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env);

ENVIRONMENT
  .set(ENV_ASSET_PATH, "./examples/assets")
  .set(ENV_SCRIPT_PATH, "./examples/scripts")
  .set(ENV_STATSD_HOST, "localhost");

// Create container and register modules.
const CONTAINER = new Container("Main", ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(Process)
  .registerModule(Script)
  .registerModule(WinstonLog)
  .registerModule(StatsdMetric);

// Start modules.
CONTAINER.start()
  .subscribe({
    error: (error) => process.stderr.write(error),
  });
