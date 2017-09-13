"use strict";
const process = require("process");
const gulp = require("gulp");
const gutil = require("gulp-util");
const config = require("./config.js");
const shell = require("./shell.js");

module.exports = {
  /** Get external dependencies from 'package.json' file. */
  packageJsonDependencies: () => {
    const dependencies = config.package.json.dependencies;
    const externals = {};
    if (dependencies != null) {
      for (const key in dependencies) {
        externals[key] = "commonjs " + key;
      }
    }
    return externals;
  },
  /** Map partial dependencies to package. */
  mapPartialDependencies: (target, partials) => {
    const externals = {};
    for (const key of partials) {
      externals[key] = "commonjs " + target;
    }
    return externals;
  },
  /** Run webpack build. */
  run: (root, done) => {
    const command = ["webpack"];
    if (config.cli.production) {
      command.push("-p");
    }
    shell.run(command.join(" "), root, done);
  },
};
