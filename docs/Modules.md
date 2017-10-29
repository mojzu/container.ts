# Modules

Modules are split into `container.ts/lib/modules` and `container.ts/lib/node-modules`.

Modules in `node-modules` depend on Node.js APIs.

## Logs

Module for handling other modules logs.

```TypeScript
import { ContainerLogMessage } from "container.ts";
import { Logs } from "container.ts/lib/modules";

// Extend the abstract 'Logs' module to handle modules logs.
export class AppLogs extends Logs {

  public static readonly NAME: string = "Logs";

  // All logs produced by modules in the container are handled here.
  // Logs are filtered by level using 'LOG_LEVEL' environment variable.
  // Levels are based on RFC5424 so they can be passed to a logging library.
  protected handleLog(log: ContainerLogMessage): void {
    // ...
  }

}
```

## Metrics

Module for handling other modules metrics.

```TypeScript
import { ContainerMetricMessage } from "container.ts";
import { Metrics } from "container.ts/lib/modules";

// Extend the abstract 'Metrics' module to handle modules metrics.
export class AppMetrics extends Metrics {

  public static readonly NAME: string = "Metrics";

  // All metrics produced by modules in the container are handled here.
  // Types are based on StatsD so they can be passed to a metrics library.
  protected handleMetric(metric: ContainerMetricMessage): void {
    // ...
  }

}
```

## Process

Module for Node.js process management and metrics.

```TypeScript
import { IProcessOptions, Process } from "container.ts/lib/node-modules";

// Extend the 'Process' class to override defaults.
export class AppProcess extends Process {

  public static readonly NAME: string = "Process";

  // Override 'options' getter to set the processes name, version and environment.
  // Name is used to change the Node.js process title.
  public get options(): IProcessOptions {
    return {
      name: "main",
      version: "1.2.3",
      nodeEnvironment: "production",
    };
  }

  // Override 'metricInterval' to change rate at which process
  // metrics are collected, default is every 60 seconds.
  public get metricInterval(): number { return 120000; }

  public example() {
    // The process title, version and nodeEnvironment are available
    // as properties on an instance of this class.
    const title: string = this.title;
    const version: string = this.version;
    const nodeEnvironment: string = this.nodeEnvironment;

    // When 'up' method is called, this module will log information
    // about the host platform, such as architecture, Node.js version, etc.

    // This module adds handlers for SIGTERM and SIGINT signals that will
    // automatically call this.container.down in case of process exit.
  }

}
```

## Assets

Module for reading assets files directory bundled with application.

Designed to work with [pkg](https://www.npmjs.com/package/pkg).

```TypeScript
import { Container, Environment } from "container.ts";
import { Assets } from "container.ts/lib/node-modules";

// Set the 'ASSETS_PATH' variable in container environment.
const ENVIRONMENT = new Environment()
  .set(Assets.ENV.PATH, "/path/to/assets/directory");

// Register 'Assets' module in container.
const CONTAINER = new Container("Main", ENVIRONMENT)
  .registerModule(Assets.NAME, Assets);

// Resolve module reference from container.
// Or make this module a dependency of another.
const ASSETS = CONTAINER.resolve<Assets>(Assets.NAME);

// Read a binary file into a Node.js 'Buffer'.
const data = await ASSETS.readFile("data.bin").toPromise();

// Read a text file string with an encoding.
const text = await ASSETS.readFile("text.txt", { encoding: "utf8" }).toPromise();

// Read a JSON file.
const json = await ASSETS.readJson("data.json").toPromise();

// Disable caching when read a file.
const data = await ASSETS.readFile("data.bin", { cache: false }).toPromise();
```

## Scripts

Module for managing child process scripts bundled with application.

Designed to work with [pkg](https://www.npmjs.com/package/pkg).

```TypeScript
import { Container, Environment } from "container.ts";
import { Scripts } from "container.ts/lib/node-modules";

// Set the 'SCRIPTS_PATH' variable in container environment.
const ENVIRONMENT = new Environment()
  .set(Scripts.ENV.PATH, "/path/to/scripts/directory");

// Register 'Scripts' module in container.
const CONTAINER = new Container("Main", ENVIRONMENT)
  .registerModule(Scripts.NAME, Scripts);

// Resolve module reference from container.
// Or make this module a dependency of another.
const SCRIPTS = CONTAINER.resolve<Scripts>(Scripts.NAME);

// Fork a new process from a script file.
// Forked process inherits containers environment.
// Optionally pass in command line arguments and environment overrides to script.
const proc = SCRIPTS.fork("script.js", { args: ["-v"], env: { KEY: "OVERRIDE" } });

// Start a new named worker process from a script file.
// Workers are restarted by default, they may also have their uptime limited.
SCRIPTS.startWorker("1", "worker.js", { restart: true, uptimeLimit: "T1M" })
  .subscribe((worker) => {
    // Worker processes are returned via an observable.
    // When restarted the worker process is recreated and emitted again via this observable.
    // ...
  });

// Stop a named worker.
// All workers are stopped automatically on container stop.
const code = await SCRIPTS.stopWorker("1").toPromise();
```

## ScriptsNet

Provides the same interface as the `Scripts` module, internally creates a server and sends socket handles to child processes for interprocess communication. This limits the use of `process.send`.

## ChildProcess

Module for interprocess communication between a parent `ScriptsProcess` instance and its processes `ChildProcess` module.

```TypeScript
import * as process from "process";
import { Observable } from "rxjs/Observable";
import { Container, Environment, IModuleOpts } from "container.ts";
import { ChildProcess } from "container.ts/lib/node-modules";

// The 'ChildProcess' class inherits from 'Process'.
// Extend the 'ChildProcess' class in the same way as 'Process' class.
export class SubProcess extends ChildProcess {

  public static readonly NAME: string = "SubProcess";

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Receive events from the parent process.
    // Event data can be any serialisable object.
    // Other modules may depend on this and use listen/event methods.
    // Equivalent methods for parent are available on 'ScriptsProcess' instance.
    this.listen<number>("ping")
      .subscribe((data) => {
        // Ping event with number data received from parent.
        // Send events to the parent process.
        this.event<number>("pong", data * 3);
      });
  }

  public example(): Observable<number> {
    // Logs and metrics emitted by modules in a child process are forwarded
    // to the parent processes container by default.
    this.log.info("log sent to parent");
    this.metric.increment("parentCounter");

    // Make a function call to any module in the parent container.
    // Target function must return an observable of serialisable data.
    // Function arguments may be passed in options.
    // Equivalent methods for parent are available on 'ScriptsProcess' instance.
    return this.call("ParentModule", "parentMethod", { args: [1, 2, 3] });
  }

}

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Register 'SubProcess' module in container.
const CONTAINER = new Container("Worker", ENVIRONMENT)
  .registerModule(SubProcess.NAME, SubProcess);

// Signal operational.
CONTAINER.up()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
```
