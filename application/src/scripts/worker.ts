/// <reference types="node" />
import * as process from "process";
import { Container, Environment } from "container.ts";
import { Validate } from "container.ts/lib/validate";
import { Asset, ChildProcess, RestifyServer } from "container.ts/modules";

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Get script name from inherited environment.
const NAME = Validate.isString(ENVIRONMENT.get(ChildProcess.ENV.NAME));

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(ChildProcess)
  .registerModule(RestifyServer);

// Start container modules.
if (require.main === module) {
  CONTAINER.start()
    .subscribe({
      error: (error) => {
        process.stderr.write(String(error) + "\n");
        process.exit(1);
      },
    });
}
