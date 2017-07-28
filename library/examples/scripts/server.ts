/// <reference types="node" />
import * as process from "process";
import { Container, Environment } from "../../container";
import { Validate } from "../../lib/validate";
import { Asset, ChildProcess, RestifyServer } from "../../modules";

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env)
  .set(RestifyServer.ENV.PORT, "4000");

// Get script name from inherited environment.
const NAME = Validate.isString(ENVIRONMENT.get(ChildProcess.ENV.NAME));

// Create container and register modules.
// Populate container for dependency injection.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(ChildProcess)
  .registerModule(RestifyServer);

// Start container modules.
CONTAINER.start()
  .subscribe({
    error: (error) => {
      process.stderr.write(String(error) + "\n");
      process.exit(1);
    },
  });
