import * as fuseBox from "fuse-box";
import * as path from "path";
import { argv } from "yargs";
import { clean } from "./fuse-tools/clean";
import { shell } from "./fuse-tools/shell";
const CWD = path.resolve(__dirname);

// Clean compiled files.
fuseBox.Sparky.task("clean", () => {
  return clean(CWD, [
    ".fusebox",
    "coverage",
    "*.tgz",
    "*.log",
    "index.d.ts",
    "index.js.map",
    "index.js",
    "container",
    "lib"
  ]);
});

// Clean and remove Node modules.
fuseBox.Sparky.task("distclean", ["clean"], () => {
  return clean(CWD, ["node_modules"]);
});

// Run TypeScript compiler.
fuseBox.Sparky.task("tsc", ["clean"], () => {
  return shell("tsc", CWD);
});

// Run TSLint linter.
fuseBox.Sparky.task("lint", () => {
  return shell("tslint -c tslint.json -p tsconfig.json", CWD);
});

// Build worker script bundle for tests.
fuseBox.Sparky.task("test-worker", () => {
  const fuse = fuseBox.FuseBox.init({
    homeDir: "src",
    output: "src/lib/node/modules/__tests__/scripts/$name.js",
    target: "server"
  });
  fuse.bundle("script.test").instructions(" > [lib/node/modules/__tests__/scripts/script.test.ts]");
  fuse.bundle("script-error.test").instructions(" > [lib/node/modules/__tests__/scripts/script-error.test.ts]");
  fuse.bundle("worker.test").instructions(" > [lib/node/modules/__tests__/scripts/worker.test.ts]");
  return fuse.run();
});

// Run Jest tests with coverage.
fuseBox.Sparky.task("test", ["clean", "test-worker"], () => {
  return shell("jest --coverage", CWD);
});

// Run example.
fuseBox.Sparky.task("example", () => {
  return shell(`ts-node ./examples/${argv._[1] || "container"}.ts`, CWD);
});

// Build library for distribution.
fuseBox.Sparky.task("dist", ["lint", "test", "tsc"], () => {
  return shell("npm pack", CWD);
});

// TODO(M): Docs fuse task(s).
