"use strict";
const process = require("process");
const gulp = require("gulp");
const gutil = require("gulp-util");
const shell = require("./shell");

function hostVersion() {
  return "node" + process.version[1];
}

function hostPlatform() {
  switch (process.platform) {
    case "linux": {
      return "linux";
    }
    case "win32": {
      return "win";
    }
  }
}

function hostArch() {
  switch (process.arch) {
    case "x64": {
      return "x64";
    }
    case "ia32": {
      return "x86";
    }
    case "arm": {
      return "armv6";
    }
  }
}

module.exports = {
  /**
   * Package application into binary for host platform.
   * TODO: Improve version/platform/arch support.
   * TODO: Improve native module support.
   */
  run: (configuration, nativeModules, root, done) => {
    const hostTarget = [hostVersion(), hostPlatform(), hostArch()].join("-");
    gutil.log("[pkg]", hostTarget);

    for (const path of nativeModules) {
      gutil.log("[pkg]", "[module]", path);
      gulp.src(path).pipe(gulp.dest("./build"));
    }

    const command = ["pkg", "--targets", hostTarget, "--out-path", "build", "."];
    shell.run(command.join(" "), root, done);
  },
};
