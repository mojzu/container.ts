"use strict";
const path = require("path");
const gulp = require("gulp");
const gutil = require("gulp-util");
const clean = require("./gulp/clean");

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
