/// <reference types="node" />
import * as process from "process";
import { Container, Environment } from "../../container";
import { Validate } from "../../lib/validate";
import {
  Asset,
  ENV_SCRIPT_NAME,
  ChildProcess,
  ENV_SOCKETIO_PORT,
  SocketioServer,
} from "../../modules";

// Create environment from process and define variables.
const ENVIRONMENT = new Environment(process.env)
  .set(ENV_SOCKETIO_PORT, "4001");

// Get script name from inherited environment.
const NAME = Validate.isString(ENVIRONMENT.get(ENV_SCRIPT_NAME));

// Create container and register modules.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(ChildProcess)
  .registerModule(SocketioServer);

// Start modules.
CONTAINER.start()
  .subscribe({
    error: (error) => {
      process.stderr.write(String(error) + "\n");
      process.exit(1);
    },
  });
