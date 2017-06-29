// Webpack configuration file.
// <https://webpack.js.org/configuration/>
var webpack = require("webpack");
var path = require("path");
var fs = require("fs");

/** Use `package.json` file for external dependencies. */
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
  // Generate main binary bundle.
  entry: {
    main: path.resolve("./src/main.ts"),
  },
  output: {
    path: path.resolve("./dist"),
    filename: "[name].js",
  },
  // Load TypeScript and source map files.
  // Exclude Node modules.
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
  // Target Node environment.
  target: "node",
  node: {
    __filename: false,
    __dirname: false,
  },
  // Generate source map for bundle.
  devtool: "source-map",
  // Do not bundle Node modules.
  externals: [externalDependencies(), {
    // Additional external dependencies added here.
  }],
};
