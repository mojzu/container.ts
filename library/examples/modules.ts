/// <reference types="node" />
import * as process from "process";
import * as path from "path";
import { Container, Environment } from "../container";
import {
  Asset,
  Process,
  Script,
  WinstonLog,
  StatsdMetric,
} from "../modules";
import { Manager } from "./src";

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env)
  .set(Asset.ENV.PATH, path.resolve("./examples/assets"))
  .set(Script.ENV.PATH, path.resolve("./examples/scripts"))
  .set(StatsdMetric.ENV.HOST, "localhost");

// Create container and register modules.
const CONTAINER = new Container("Main", ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(Process)
  .registerModule(Script)
  .registerModule(WinstonLog)
  .registerModule(StatsdMetric)
  .registerModule(Manager);

// Start container modules.
CONTAINER.start()
  .subscribe({
    error: (error) => {
      process.stderr.write(String(error) + "\n");
      process.exit(1);
    },
  });
