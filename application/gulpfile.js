"use strict";
const path = require("path");
const gulp = require("gulp");
const gutil = require("gulp-util");
const clean = require("./gulp/clean.js");
const config = require("./gulp/config.js");
const file = require("./gulp/file.js");
const pkg = require("./gulp/pkg.js");
const shell = require("./gulp/shell.js");
const webpack = require("./gulp/webpack.js");

// Delete build directories.
gulp.task("clean", (done) => {
  clean.run(config.package.path, ["build", "coverage", "dist"], done);
});

// Clean and delete `node_modules` directory.
gulp.task("distclean", ["clean"], (done) => {
  clean.run(config.package.path, ["docs/typedoc", "node_modules"], done);
});

// Run TypeScript compiler.
gulp.task("tsc", ["clean"], (done) => {
  shell.run("tsc", config.package.path, done);
});

// Run Webpack compiler.
gulp.task("webpack", ["clean"], (done) => {
  webpack.run(config.package.path, done);
});

// (Re)write generated assets files.
gulp.task("assets", (done) => {
  // Application process information asset file.
  const processJson = {
    name: config.package.json.name,
    version: config.package.json.version,
  };
  // Append release type to version number.
  processJson.version += config.production ? "-production" : "-development";
  file.writeJson(config.package.path, "./assets/process.json", processJson, done);
});

// Run tests with coverage reporting.
gulp.task("test", ["tsc"], (done) => {
  shell.run("istanbul cover test.js -x \"**/*.spec.js\"", config.package.path, done);
});

// Run linter.
gulp.task("lint", (done) => {
  shell.run("tslint -p tsconfig.json --type-check", config.package.path, done);
});

// Build documentation.
gulp.task("docs", (done) => {
  shell.run("typedoc --out docs/typedoc .", config.package.path, done);
});

// Start application.
// TODO: Add watch option.
gulp.task("start", ["assets", "tsc"], (done) => {
  shell.run("node dist/main.js", config.package.path, done);
});

// // Start application with Chrome V8 inspector.
// // TODO: VSCode debugger integration.
// gulp.task("inspect", ["assets", "tsc"], (done) => {
//   shell.run("node --inspect dist/main.js", config.package.path, done);
// });

// Build application binary.
gulp.task("build", ["assets", "webpack", "lint"], (done) => {
  pkg.run(config.package.path, "build", done);
});
