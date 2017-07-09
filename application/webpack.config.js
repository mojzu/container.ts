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

/** Partial RxJS imports must be mapped to module. */
function rxJsDependencies() {
  var externals = {};
  var dependencies = [
    "rxjs/Observable",
    "rxjs/Subject",
    "rxjs/BehaviorSubject",
    "rxjs/add/observable/of",
    "rxjs/add/observable/throw",
    "rxjs/add/observable/forkJoin",
    "rxjs/add/observable/bindNodeCallback",
    "rxjs/add/observable/fromEvent",
    "rxjs/add/operator/do",
    "rxjs/add/operator/map",
    "rxjs/add/operator/catch",
    "rxjs/add/operator/filter",
    "rxjs/add/operator/switchMap",
    "rxjs/add/operator/take",
    "rxjs/add/operator/takeUntil",
    "rxjs/add/operator/timeout",
  ];
  for (var key of dependencies) {
    externals[key] = "commonjs rxjs";
  }
  return externals;
}

module.exports = {
  // Main script for binary.
  // Additional scripts bundled with application.
  entry: {
    "dist/main": path.resolve("./src/main.ts"),
    "dist/scripts/worker": path.resolve("./src/scripts/worker.ts"),
  },
  output: {
    path: path.resolve("./"),
    filename: "[name].js",
  },
  // TypeScript sources compiled by ts-loader to ES2016.
  // Passed to Babel for transpiling to ES2015 for minification.
  module: {
    loaders: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [
        { loader: "babel-loader", options: { presets: ["es2015"] } },
        { loader: "ts-loader" },
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
  externals: [externalDependencies(), rxJsDependencies(), {
    // Additional external dependencies added here.
  }],
};
