import { Container, Environment, IModuleDependencies, Module } from "../../../../../container";
import { Process } from "../../process";

class TestModule extends Module {
  public static readonly moduleName: string = "Test";

  protected readonly process!: Process;

  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { process: Process });
  }
}

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Worker", ENVIRONMENT).registerModules([Process, TestModule]);

// Signal operational.
CONTAINER.up().subscribe({
  error: (error) => {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  }
});
