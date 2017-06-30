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
  // Main script for binary.
  entry: {
    main: path.resolve("./src/main.ts"),
  },
  output: {
    path: path.resolve("./dist"),
    filename: "[name].js",
  },
  // TypeScript sources compiled by ts-loader to ES2016.
  // Passed to Babel for transpiling to ES2015 for minification.
  module: {
    loaders: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "babel-loader",
          options: { presets: ["es2015"] },
        },
        {
          loader: "ts-loader",
        },
      ],
    }],
  },
  resolve: {
    extensions: [".ts"],
  },
  // Target Node environment.
  // Disable filename/dirname polyfills.
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
