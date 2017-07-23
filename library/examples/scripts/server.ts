/// <reference types="node" />
import * as process from "process";
import { Container, Environment } from "../../container";
import { Validate } from "../../lib/validate";
import {
  Asset,
  ENV_SCRIPT_NAME,
  ChildProcess,
  ENV_RESTIFY_PORT,
  RestifyServer,
} from "../../modules";

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env)
  .set(ENV_RESTIFY_PORT, "4000");

// Get script name from inherited environment.
const NAME = Validate.isString(ENVIRONMENT.get(ENV_SCRIPT_NAME));

// Create container and register modules.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(ChildProcess)
  .registerModule(RestifyServer);

// Start modules.
CONTAINER.start()
  .subscribe({
    error: (error) => process.stderr.write(error),
  });
