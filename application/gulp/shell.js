"use strict";
const process = require("process");
const path = require("path");
const childProcess = require("child_process");
const gutil = require("gulp-util");
const config = require("./config.js");

module.exports = {
  /** Execute command as child process. */
  run: (command, cwd, done) => {
    // Adds Gulp CLI configuration to environment for usability.
    for (const key in config.cli) {
      process.env[key] = config.cli[key];
    }
    // Adds Node binaries directory to PATH for usability.
    process.env.PATH += ";" + path.resolve("./node_modules/.bin");
    gutil.log("[shell]", command);

    childProcess.execSync(command, {
      stdio: [null, process.stdout, process.stderr],
      cwd: cwd,
    });
    done();
  },
};
