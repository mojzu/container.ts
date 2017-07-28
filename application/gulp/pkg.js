"use strict";
const process = require("process");
const path = require("path");
const gulp = require("gulp");
const gutil = require("gulp-util");
const config = require("./config.js");
const shell = require("./shell.js");

const PLATFORMS = {
  linux: "linux",
  win32: "win",
  darwin: "macos",
};

const ARCHITECTURES = {
  x64: "x64",
  ia32: "x86",
  arm: "armv6",
};

function defaultTarget() {
  const version = `node${process.version[1]}`;
  const platform = PLATFORMS[process.platform];
  const arch = ARCHITECTURES[process.arch];
  return `${version}-${platform}-${arch}`;
}

module.exports = {
  /** Package application into binary for host platform(s). */
  run: (root, output, done) => {
    const targets = config.pkg.targets || [];
    let command = ["pkg", ".", "--out-path", output];

    // Target host platform by default.
    if (targets.length === 0) {
      targets.push(defaultTarget());
    }

    // If target(s) specified, append to command.
    if (targets.length > 0) {
      command.push("--targets");
      command.push(targets.join(","));

      // Copy target native modules to output directory.
      for (const target of targets) {
        const nativeModules = path.join(config.pkg.nativeModules, target, "/**/*");
        gulp.src(nativeModules).pipe(gulp.dest(path.resolve(output, target)));
        gutil.log("[pkg]", "[modules]", nativeModules);
      }
    }

    command = command.join(" ");
    gutil.log("[pkg]", command);
    shell.run(command, root, done);
  },
};
