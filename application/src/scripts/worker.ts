import * as process from "process";
import * as constants from "../constants";
import { Container, Environment } from "../container";
import { Assets, Process } from "../modules";

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Get script name from environment or use default.
const NAME = ENVIRONMENT.get(constants.ENV_NAME) || constants.DEFAULT_NAME;

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container(NAME, ENVIRONMENT)
  .registerModule(constants.ASSETS, Assets)
  .registerModule(constants.PROCESS, Process);

// Run following section if this is the main script.
if (require.main === module) {
  // Start container modules.
  CONTAINER.start()
    .subscribe({
      error: (error) => process.stderr.write(error),
    });
}
