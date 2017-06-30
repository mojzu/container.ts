"use strict";
const process = require("process");
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
   * TODO: Copy native modules to build where available.
   */
  run: (configuration, root, done) => {
    const hostTarget = [hostVersion(), hostPlatform(), hostArch()].join("-");
    gutil.log("[pkg]", hostTarget);

    const command = ["pkg", "--targets", hostTarget, "--out-path", "build", "."];
    shell.run(command.join(" "), root, done);
  },
};
