"use strict";
const process = require("process");
const path = require("path");
const childProcess = require("child_process");
const del = require("del");
const argv = require("minimist")(process.argv.slice(2));
const { Sparky } = require("fuse-box");

// Library package path and file.
const packagePath = path.resolve(__dirname);
const packageJson = require("./package.json");

// Delete relative paths to absolute root.
function clean(root, targetPaths) {
  const absolutePaths = targetPaths.map((p) => path.join(root, p));
  return del(absolutePaths);
}

// Execute command as child process.
// Adds Node binaries directory to PATH for usability.
function shell(command) {
  childProcess.execSync(command, {
    stdio: [null, process.stdout, process.stderr],
    env: { PATH: `${process.env.PATH}:${path.resolve("./node_modules/.bin")}` },
  });
  return Promise.resolve();
}

// Clean compiled files.
Sparky.task("clean", () => {
  return clean(packagePath, [
    // Root files.
    "coverage",
    "*.tgz",
    "*.log",
    "index.d.ts",
    "index.js.map",
    "index.js",
    // Sub-package files.
    "container",
    "lib",
  ]);
});

// Clean and remove Node modules.
Sparky.task("distclean", ["clean"], () => {
  return clean(packagePath, ["node_modules"]);
});

// Run TypeScript compiler.
Sparky.task("tsc", ["clean"], () => {
  return shell("tsc");
});

// Run linter.
Sparky.task("lint", () => {
  return shell("tslint -c tslint.json -p tsconfig.json --type-check");
});

// Run tests with coverage reporting.
Sparky.task("test", ["clean"], () => {
  return shell("jest --coverage");
});

// Run example.
Sparky.task("example", () => {
  const target = argv.f || argv.file;
  return shell(`ts-node ./examples/${target}.ts`);
});

// Build library for distribution.
Sparky.task("dist", ["lint", "test", "tsc"], () => {
  return shell("npm pack");
});
