// Webpack configuration file.
// https://webpack.github.io/docs/configuration.html
// http://jlongster.com/Backend-Apps-with-Webpack--Part-I
var webpack = require("webpack");
var path = require("path");
var fs = require("fs");

// Retrieves module list from `node_modules` directory.
function get_node_modules(data) {
    fs.readdirSync("node_modules").filter(function(value) {
        return [".bin"].indexOf(value) === -1;
    }).forEach(function(mod) {
        data[mod] = "commonjs " + mod;
    });
    return data;
}

module.exports = {
    entry: {
        main: "./src/main.ts",
    },
    target: "node",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].bundle.js",
    },
    resolve: {
        extensions: ["", ".js", ".ts"],
    },
    // Generate source map for bundle.
    devtool: "source-map",
    // Load TypeScript and source map files.
    module: {
        preLoaders: [{
            test: /\.js$/,
            loader: "source-map-loader"
        }],
        loaders: [{
            test: /\.tsx?$/,
            loader: "awesome-typescript-loader"
        }],
    },
    plugins: [
        // Make error stack traces refer to TypeScript files.
        new webpack.BannerPlugin("require('source-map-support').install();", {
            raw: true,
            entryOnly: false
        }),
    ],
    // Do not bundle Node modules.
    externals: get_node_modules({}),
};
