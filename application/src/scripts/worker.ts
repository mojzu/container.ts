import * as process from "process";
import * as Debug from "debug";
import * as constants from "../constants";
import { Environment } from "../container";

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Get script name from environment.
const NAME = ENVIRONMENT.get(constants.ENV_NAME) || constants.DEFAULT_NAME;

// Run following section if this is the main script.
if (require.main === module) {
  // Create debug instance for script.
  const debug = Debug(NAME);
  debug("worker process");
}
