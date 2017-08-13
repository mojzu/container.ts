/// <reference types="node" />
import * as process from "process";
import { Container, Environment } from "container.ts";
import { Validate } from "container.ts/lib/validate";
import { Asset, ChildProcess } from "container.ts/modules";
import { SocketioServer, SocketController } from "../modules";

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env);

// Get script name from inherited environment.
const NAME = Validate.isString(ENVIRONMENT.get(ChildProcess.ENV.NAME));

// Create container and register modules.
// Populate container for dependency injection.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(ChildProcess)
  .registerModule(SocketioServer)
  .registerModule(SocketController);

// Start container modules.
if (require.main === module) {
  CONTAINER.start()
    .subscribe({
      error: (error) => {
        process.stderr.write(`${error}\n`);
        process.exit(1);
      },
    });
}
