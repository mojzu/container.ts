import * as process from "process";
import { Container, Environment } from "../container";
import {
  ENV_ASSET_PATH,
  ENV_SCRIPT_PATH,
  Asset,
  Process,
  Script,
} from "../modules";

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env);

ENVIRONMENT
  .set(ENV_ASSET_PATH, "./examples/assets")
  .set(ENV_SCRIPT_PATH, "./examples/scripts");

// Create container and register modules.
const CONTAINER = new Container("Main", ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(Process)
  .registerModule(Script);

// Start modules.
CONTAINER.start()
  .subscribe({
    error: (error) => process.stderr.write(error),
  });
