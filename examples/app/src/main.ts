import { Container } from "container.ts";
import { Assets, Process, Scripts } from "container.ts/lib/node-modules";
import * as process from "process";
import { argv } from "yargs";
import { ENVIRONMENT } from "./environment";
import { Main, Rollbar, Statsd, Winston } from "./modules";

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Main", ENVIRONMENT, argv)
  .registerModules([
    Process,
    Main,
    Assets,
    Scripts,
    Winston,
    Statsd,
  ]);

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(Rollbar.ENV.ACCESS_TOKEN)) {
  CONTAINER.registerModule(Rollbar);
}

// Signal operational.
CONTAINER.up()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
