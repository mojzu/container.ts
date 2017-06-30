"use strict";
const gulp = require("gulp");
const gutil = require("gulp-util");
const clean = require("./gulp/clean");
const shell = require("./gulp/shell");
const pkg = require("./gulp/pkg.js");

/** Task configuration. */
const configuration = {
  /** Production short and verbose flags. */
  production: !!(gutil.env.p || gutil.env.production),
};

/** Determine `webpack` command using configuration. */
function webpackCommand() {
  const command = ["webpack"];
  if (configuration.production) command.push("-p");
  return command.join(" ");
}

// Delete build directories.
gulp.task("clean", (done) => {
  clean.run(__dirname, ["build", "coverage", "dist"], done);
});

// Clean and delete `node_modules` directory.
gulp.task("distclean", ["clean"], (done) => {
  clean.run(__dirname, ["docs", "node_modules"], done);
});

// Run TypeScript compiler.
gulp.task("tsc", ["clean"], (done) => {
  shell.run("tsc", __dirname, done);
});

// Run Webpack compiler.
gulp.task("webpack", ["clean"], (done) => {
  shell.run(webpackCommand(), __dirname, done);
});

// Run tests with coverage reporting.
gulp.task("test", ["tsc"], (done) => {
  shell.run("istanbul cover test.js -x \"**/*.spec.js\"", __dirname, done);
});

// Run linter.
gulp.task("lint", (done) => {
  shell.run("tslint -p tsconfig.json --type-check", __dirname, done);
});

// Build documentation.
gulp.task("docs", (done) => {
  shell.run("typedoc --out docs .", __dirname, done);
});

// Start application.
// TODO: Add watch option.
gulp.task("start", ["tsc"], (done) => {
  shell.run("node dist/main.js", __dirname, done);
});

// Start application with Chrome V8 inspector.
gulp.task("inspect", ["tsc"], (done) => {
  shell.run("node --inspect dist/main.js", __dirname, done);
});

// Build application binary.
gulp.task("build", ["webpack"], (done) => {
  pkg.run(configuration, __dirname, done);
});
