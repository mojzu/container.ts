// Webpack configuration file.
// <https://webpack.js.org/configuration/>
const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const wutil = require("./gulp/webpack");

// Use `package.json` file for external dependencies.
const packageJsonDependencies = wutil.packageJsonDependencies();

// Partial RxJS imports must be mapped to module.
const rxjsDependencies = wutil.mapPartialDependencies("rxjs", [
  "rxjs/Observable",
  "rxjs/add/observable/empty",
  "rxjs/add/observable/of",
  "rxjs/add/observable/range",
  "rxjs/add/observable/bindNodeCallback",
  "rxjs/add/operator/do",
  "rxjs/add/operator/map",
  "rxjs/add/operator/take",
  "rxjs/add/operator/timeout",
]);

module.exports = {
  // Main script for binary.
  // Additional scripts bundled with application.
  entry: {
    "dist/main": path.resolve("./src/main.ts"),
    "dist/scripts/server": path.resolve("./src/scripts/server.ts"),
    "dist/scripts/socket": path.resolve("./src/scripts/socket.ts"),
  },
  output: {
    path: path.resolve("./"),
    filename: "[name].js",
  },
  // TypeScript sources compiled by ts-loader.
  module: {
    loaders: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [{
        loader: "ts-loader"
      }],
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
  externals: [packageJsonDependencies, rxjsDependencies, {
    // Additional external dependencies added here.
    "container.ts": "commonjs container.ts",
    "container.ts/modules": "commonjs container.ts/modules",
    "container.ts/lib/validate": "commonjs container.ts/lib/validate",
  }],
};
