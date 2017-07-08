import * as process from "process";
import * as Debug from "debug";
import * as constants from "../constants";
import { Environment } from "../container";
import { Process } from "../modules";

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Get script title and name from environment.
const TITLE = ENVIRONMENT.get(constants.ENV_TITLE) || constants.DEFAULT_TITLE;
const NAME = ENVIRONMENT.get(constants.ENV_NAME) || constants.DEFAULT_NAME;

// Run following section if this is the main script.
if (require.main === module) {
  // Set process title, create debug instance for script.
  Process.setTitle(TITLE);
  const debug = Debug(NAME);
  debug("worker process");
}
