import { Container } from "container.ts";
import { Assets, Scripts, ScriptsNet } from "container.ts/lib/node-modules";
import * as process from "process";
import { argv } from "yargs";
import { ENVIRONMENT } from "./environment";
import { Main, Rollbar, Statsd, Winston } from "./modules";

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Main", ENVIRONMENT, argv)
  .registerModule(Main.NAME, Main)
  .registerModule(Assets.NAME, Assets)
  .registerModule(Scripts.NAME, ScriptsNet)
  .registerModule(Winston.NAME, Winston)
  .registerModule(Statsd.NAME, Statsd);

// Register additional modules based on environment definitions.
if (!!ENVIRONMENT.get(Rollbar.ENV.ACCESS_TOKEN)) {
  CONTAINER.registerModule(Rollbar.NAME, Rollbar);
}

// Signal operational.
CONTAINER.up()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
