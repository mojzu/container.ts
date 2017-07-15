"use strict";
const path = require("path");
const gulp = require("gulp");
const gutil = require("gulp-util");
const clean = require("./gulp/clean");
const shell = require("./gulp/shell");

// Library root directory.
const PATH = path.resolve(__dirname);

// Delete compiled files.
gulp.task("clean", (done) => {
  clean.run(PATH, [
    "*.tgz",
    "*.log",
    "**/*.d.ts",
    "**/*.js.map",
    "index.js",
    "test.js",
  ], done);
});

// Clean and delete modules.
gulp.task("distclean", ["clean"], (done) => {
  clean.run(PATH, ["node_modules"], done);
});

// Run TypeScript compiler.
gulp.task("tsc", ["clean"], (done) => {
  shell.run("tsc", PATH, done);
});

// Run tests with coverage reporting.
gulp.task("test", ["tsc"], (done) => {
  shell.run("istanbul cover test.js -x \"**/*.spec.js\"", PATH, done);
});

// Run linter.
gulp.task("lint", (done) => {
  shell.run("tslint -p tsconfig.json --type-check", PATH, done);
});

// Build documentation.
gulp.task("docs", (done) => {
  shell.run("typedoc --out docs/typedoc .", PATH, done);
});

// Build library.
gulp.task("build", ["tsc"], (done) => {
  shell.run("npm pack", PATH, done);
});
