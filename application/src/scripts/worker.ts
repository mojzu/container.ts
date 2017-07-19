import * as process from "process";
import { Container, Environment } from "container.ts";
import { ENV_SCRIPT_NAME, Asset, ChildProcess } from "container.ts/modules";
import * as constants from "../constants";

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Get script name from environment or use default.
const NAME = ENVIRONMENT.get(ENV_SCRIPT_NAME) || constants.DEFAULT_NAME;

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(Asset)
  .registerModule(ChildProcess);

// Run following section if this is the main script.
if (require.main === module) {
  // Start container modules.
  CONTAINER.start()
    .subscribe({
      error: (error) => process.stderr.write(error),
    });
}
