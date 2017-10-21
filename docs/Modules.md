# Modules

## Process

Module for Node.js process management and metrics.

```TypeScript
import { IProcessOptions, Process } from "container.ts/lib/node-modules";

// Extend the 'Process' class to override defaults.
export class MainProcess extends Process {

  public static readonly NAME: string = "Main";

  // Override 'options' getter to set the processes name, version and environment.
  // Name is used to change the Node.js process name.
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

    // When 'start' method is called, this module will log information
    // about the host platform, such as architecture, Node.js version, etc.

    // This module adds handlers for SIGTERM and SIGINT signals that will
    // automatically call this.container.stop in case of process exit.
  }

}
```

## Assets

Module for reading assets files directory bundled with application.

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
