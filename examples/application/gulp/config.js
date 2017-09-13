"use strict";
const process = require("process");
const path = require("path");
const gulp = require("gulp");
const gutil = require("gulp-util");

const PACKAGE_PATH = path.resolve(path.dirname(__dirname));
const PACKAGE_JSON = require(path.resolve(PACKAGE_PATH, "package.json"));
const PKG_NATIVE_MODULES = path.resolve(PACKAGE_PATH, "gulp", "native_modules");

module.exports = {
  /** Package definitions. */
  package: {
    /** Absolute path. */
    path: PACKAGE_PATH,
    /** Package file contents. */
    json: PACKAGE_JSON,
  },

  /** Gulp command line configuration. */
  cli: {
    /** Production short and verbose flags via command line or environment. */
    production: !!(gutil.env.p || gutil.env.production || process.env.production) ? "1" : "",
  },

  /** Pkg configuration. */
  pkg: {
    /** Target platforms. */
    targets: [
      // "node6-linux-x64",
      // ...
    ],
    /** Native modules for target platforms. */
    nativeModules: PKG_NATIVE_MODULES,
  },
};
