"use strict";
const path = require("path");
const buffer = require("buffer");
const fs = require("fs");
const gutil = require("gulp-util");

module.exports = {
  /** Write JSON content to file. */
  writeJson: (root, target, content, done) => {
    const absolutePath = path.resolve(root, target);
    content = JSON.stringify(content, null, 2);

    fs.writeFile(absolutePath, content, (error) => {
      gutil.log("[writeJson]", target);
      done(error);
    });
  },
};
