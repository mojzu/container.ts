"use strict";
const path = require("path");
const gulp = require("gulp");
const gutil = require("gulp-util");
const clean = require("./gulp/clean");
const shell = require("./gulp/shell");

// Library package path and file.
const packagePath = path.resolve(__dirname);
const packageJson = require("./package.json");

// Delete compiled files.
gulp.task("clean", (done) => {
  clean.run(packagePath, [
    "*.tgz",
    "*.log",
    "test.d.ts",
    "test.js.map",
    "test.js",
  ].concat(packageJson.files), done);
});

// Clean and delete modules generated documentation.
gulp.task("distclean", ["clean"], (done) => {
  clean.run(packagePath, ["docs/typedoc", "node_modules"], done);
});

// Run TypeScript compiler.
gulp.task("tsc", ["clean"], (done) => {
  shell.run("tsc", packagePath, done);
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

// Build library.
gulp.task("build", ["tsc"], (done) => {
  shell.run("npm pack", packagePath, done);
});
