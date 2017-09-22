// Webpack configuration file.
// <https://webpack.js.org/configuration/>
const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const wutil = require("./gulp/webpack");

// Use `package.json` file for external dependencies.
const packageJsonDependencies = wutil.packageJsonDependencies();

// Partial container.ts imports must be mapped to module.
const containerDependencies = {
  "container.ts": "commonjs container.ts",
  "container.ts/modules": "commonjs container.ts/modules",
  "container.ts/lib/error": "commonjs container.ts/lib/error",
  "container.ts/lib/validate": "commonjs container.ts/lib/validate",
};

// Partial RxJS imports must be mapped to module.
const rxjsDependencies = wutil.mapPartialDependencies("rxjs", [
  // "rxjs/Observable",
  // ...
]);

module.exports = {
  // Main script for binary.
  // Additional scripts bundled with application.
  entry: {
    "dist/main": path.resolve("./src/main.ts"),
    // "dist/scripts/...": path.resolve("./src/scripts/....ts"),
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
  externals: [
    packageJsonDependencies,
    containerDependencies,
    rxjsDependencies,
    {
      // Additional external dependencies added here.
    },
  ],
};
