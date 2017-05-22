// Webpack configuration file.
// <https://webpack.github.io/docs/configuration.html>
// <http://jlongster.com/Backend-Apps-with-Webpack--Part-I>
var webpack = require("webpack");
var path = require("path");
var fs = require("fs");

/**
 * Use `package.json` file for external dependencies.
 */
function externalDependencies() {
  var packageJson = require("./package.json");
  var dependencies = packageJson["dependencies"];
  var externals = {};
  if (dependencies != null) {
    for (var key in dependencies) {
      externals[key] = "commonjs " + key;
    }
  }
  return externals;
}

module.exports = {
  entry: {
    main: path.resolve("./src/main.ts"),
  },
  output: {
    path: path.resolve("./dist"),
    filename: "[name].bundle.js",
  },
  // Load TypeScript and source map files.
  module: {
    rules: [{
      test: /\.ts?$/,
      loader: "ts-loader",
      exclude: path.resolve("./node_modules/"),
    }],
  },
  resolve: {
    extensions: [".ts"],
  },
  target: "node",
  // Generate source map for bundle.
  devtool: "source-map",
  // Do not bundle Node modules.
  externals: [externalDependencies(), {
    // Additional dependencies...
  }],
};
