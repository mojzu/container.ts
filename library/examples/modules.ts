/// <reference types="node" />
import * as process from "process";
import * as path from "path";
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
import { Manager } from "./src";

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env)
  .set(ENV_ASSET_PATH, path.resolve("./examples/assets"))
  .set(ENV_SCRIPT_PATH, path.resolve("./examples/scripts"))
  .set(ENV_STATSD_HOST, "localhost");

// Create container and register modules.
const CONTAINER = new Container("Main", ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(Process)
  .registerModule(Script)
  .registerModule(WinstonLog)
  .registerModule(StatsdMetric)
  .registerModule(Manager);

// Start modules.
CONTAINER.start()
  .subscribe({
    error: (error) => {
      process.stderr.write(String(error) + "\n");
      process.exit(1);
    },
  });
