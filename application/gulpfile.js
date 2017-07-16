"use strict";
const path = require("path");
const gulp = require("gulp");
const gutil = require("gulp-util");
const clean = require("./gulp/clean");
const shell = require("./gulp/shell");
const file = require("./gulp/file.js");
const pkg = require("./gulp/pkg.js");

// Application package path and file.
const packagePath = path.resolve(__dirname);
const packageJson = require("./package.json");

/** Task configuration. */
const configuration = {
  /** Production short and verbose flags. */
  production: !!(gutil.env.p || gutil.env.production),
};

/** Native module file paths. */
const nativeModules = [];

/** Determine `webpack` command using configuration. */
function webpackCommand() {
  const command = ["webpack"];
  if (configuration.production) command.push("-p");
  return command.join(" ");
}

// Delete build directories.
gulp.task("clean", (done) => {
  clean.run(packagePath, ["build", "coverage", "dist"], done);
});

// Clean and delete `node_modules` directory.
gulp.task("distclean", ["clean"], (done) => {
  clean.run(packagePath, ["docs/typedoc", "node_modules"], done);
});

// Run TypeScript compiler.
gulp.task("tsc", ["clean"], (done) => {
  shell.run("tsc", packagePath, done);
});

// Run Webpack compiler.
gulp.task("webpack", ["clean"], (done) => {
  shell.run(webpackCommand(), packagePath, done);
});

// (Re)write generated assets files.
gulp.task("assets", (done) => {
  // Application process information asset file.
  const processJson = {
    name: packageJson.name,
    version: packageJson.version,
  };
  // Append release type to version number.
  processJson.version += configuration.production ? "-production" : "-development";
  file.writeJson(packagePath, "./assets/process.json", processJson, done);
});

// Run tests with coverage reporting.
gulp.task("test", ["tsc"], (done) => {
  shell.run("istanbul cover test.js -x \"**/*.spec.js\"", packagePath, done);
});

// Run linter.
gulp.task("lint", (done) => {
  shell.run("tslint -p tsconfig.json --type-check", packagePath, done);
});

// Build documentation.
gulp.task("docs", (done) => {
  shell.run("typedoc --out docs/typedoc .", packagePath, done);
});

// Start application.
// TODO: Add watch option.
gulp.task("start", ["assets", "tsc"], (done) => {
  shell.run("node dist/main.js", packagePath, done);
});

// // Start application with Chrome V8 inspector.
// // TODO: VSCode debugger integration.
// gulp.task("inspect", ["assets", "tsc"], (done) => {
//   shell.run("node --inspect dist/main.js", packagePath, done);
// });

// Build application binary.
gulp.task("build", ["assets", "webpack", "lint"], (done) => {
  pkg.run(configuration, nativeModules, packagePath, done);
});
