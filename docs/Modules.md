# Modules

## Assets

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
