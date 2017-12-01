import { Container, Environment } from "container.ts";
import { ChildProcess } from "container.ts/lib/node-modules";

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Worker", ENVIRONMENT)
  .registerModule(ChildProcess);

// Signal operational.
CONTAINER.up()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
