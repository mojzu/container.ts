import * as process from "process";
import { argv } from "yargs";
import { Container, Environment, IModuleDependencies, IModuleOpts, Module } from "../src/container";
import { Process } from "../src/lib/node-modules";
import { Observable } from "../src/rxjs";

// Define a new module by extending the 'Module' class.
class AppModule extends Module {

  // Modules must have a name used to register them within a container.
  // This name is used to resolve module dependencies from a container.
  public static readonly NAME: string = "AppModule";

  // Override the 'dependencies' getter to define module dependencies.
  public get dependencies(): IModuleDependencies {
    // Key is the name of the property on this class to inject (see 'proc' below).
    // Value is the name of the module to inject into the property (see 'NAME' above).
    return { proc: Process.NAME };
  }

  // Injected module dependency.
  protected readonly proc: Process;

  // Optionally override the class constructor.
  // Module dependencies are available after 'super' has been called.
  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);
    // Dependencies are available now.
    // ...
  }

  // Start/stop hooks are called when the modules container methods of the same
  // name are called. Start/stop may also return an observable to perform asynchronous
  // actions, or void if none are required.
  public start(): Observable<void> | void {
    // Modules may wait for their dependencies to start using container methods.
    // A 'waitStopped' method is also available when stopping a module.
    return this.container.waitStarted(Process.NAME)
      .map(() => {
        // All modules have debug, log and metric instances.
        // Logs and metrics are sent to the container which can then be
        // handled by a logging/metrics module.
        // The logger interface is based on syslog, and metrics on StatsD.
        this.debug("something to debug");
        this.log.info("something to log", { meta: "information" });
        this.metric.increment("counter");
      });
  }

  public stop(): Observable<void> | void {
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
  .registerModule(Process.NAME, Process)
  .registerModule(AppModule.NAME, AppModule);

// Start container modules.
// The 'Process' module automatically calls container.stop when
// process is terminated by a signal.
CONTAINER.start()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
