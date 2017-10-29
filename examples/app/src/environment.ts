import { Environment, IEnvironmentVariables } from "container.ts";
import { Statsd } from "./modules";

// Environment variable default values.
const VARIABLES = {
  // Statsd module.
  [Statsd.ENV.HOST]: "localhost",
};

/** Create new environment and set defaults if variables keys are undefined. */
function configureEnvironment(...variables: IEnvironmentVariables[]): Environment {
  let environment = new Environment(...variables);

  Object.keys(VARIABLES).map((key) => {
    const value = environment.get(key) || VARIABLES[key];
    environment = environment.set(key, value);
  });

  return environment;
}

// Environment overrides provided by FuseBox.
// Fallback if overrides are undefined.
declare const __process_env__: IEnvironmentVariables;
let fuseBoxEnvironment: IEnvironmentVariables;
try {
  fuseBoxEnvironment = __process_env__;
} catch (error) {
  fuseBoxEnvironment = {};
}

// Create environment instance using process environment.
export const ENVIRONMENT = configureEnvironment(process.env, fuseBoxEnvironment);
