import * as process from "process";
import { argv } from "yargs";
import { Container, Environment, IModuleDependencies, IModuleOpts, Module } from "../src/container";
import { Observable } from "../src/container/RxJS";
import { Process } from "../src/lib/node-modules";

// Define a new module by extending the 'Module' class.
class AppModule extends Module {

  // Modules must have a name used to register them within a container.
  // This name is used to resolve module dependencies from a container.
  public static readonly moduleName: string = "AppModule";

  // Override the 'dependencies' getter to define module dependencies.
  public get moduleDependencies(): IModuleDependencies {
    // Key is the name of the property on this class to inject (see 'proc' below).
    // Value is the name of the module to inject into the property (see 'NAME' above).
    return { proc: Process };
  }

  // Injected module dependency.
  protected readonly proc: Process;

  // Optionally override the class constructor.
  // Module dependencies are available after 'super' has been called.
  public constructor(opts: IModuleOpts) {
    super(opts);
    // Dependencies are available now.
    // ...
  }

  // Up/down hooks are called when the modules container methods of the same
  // name are called. Up/down may also return an observable to perform asynchronous
  // actions, or void if none are required.
  public moduleUp(): Observable<void> | void {
    // All modules have debug, log and metric instances.
    // Logs and metrics are sent to the container which can then be
    // handled by a logging/metrics module.
    // The logger interface is based on syslog, and metrics on StatsD.
    this.debug("something to debug");
    this.log.info("something to log", { meta: "information" });
    this.metric.increment("counter");
  }

  public moduleDown(): Observable<void> | void {
    // ...
  }

}

// Create environment from process environment.
// Wrapper class with get/set methods that is passed to container.
const ENVIRONMENT = new Environment(process.env);

// Get value from environment or a default value.
const VALUE = ENVIRONMENT.get("KEY") || "DEFAULT";

// Set value(s) in environment.
ENVIRONMENT
  .set("KEY", VALUE)
  .set("KEY2", "VALUE2");

// Create container using environment and register modules.
// Optionally pass in command line arguments provided by 'yargs' package.
const CONTAINER = new Container("Main", ENVIRONMENT, argv)
  .registerModules([Process, AppModule]);

// Signal operational.
// The 'Process' module automatically calls container.down when
// process is terminated by a signal.
CONTAINER.up()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
