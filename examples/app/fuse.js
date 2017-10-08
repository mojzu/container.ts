"use strict";
const process = require("process");
const path = require("path");
const childProcess = require("child_process");
const del = require("del");
const argv = require("minimist")(process.argv.slice(2));
const {
  FuseBox,
  TypeScriptHelpers,
  BannerPlugin,
  EnvPlugin,
  UglifyJSPlugin,
  Sparky,
} = require("fuse-box");

const config = {
  // Command line arguments.
  cli: {
    production: argv.p || argv.production || false,
    pkg: false,
  },
  // Library package path and file.
  package: {
    path: path.resolve(__dirname),
    json: require("./package.json"),
  },
  // Configured bundles.
  bundles: {
    main: {
      name: "main",
      target: "main.ts",
      output: "$name.js",
      fuse: null,
      bundle: null,
    },
    server: {
      name: "server",
      target: "scripts/server.ts",
      output: "scripts/$name.js",
      fuse: null,
      bundle: null,
    },
  },
};

// Delete relative paths to absolute root.
function clean(root, targetPaths) {
  const absolutePaths = targetPaths.map((p) => path.join(root, p));
  return del(absolutePaths);
}

// Execute command as child process.
// Adds Node binaries directory to PATH for usability.
function shell(command) {
  childProcess.execSync(command, {
    stdio: [null, process.stdout, process.stderr],
    env: { PATH: `${process.env.PATH}:${path.resolve("./node_modules/.bin")}` },
  });
  return Promise.resolve();
}

// Package application into binary for host platform(s).
// Targets host platform by default.
// TODO: Copy target native modules to output directory.
function pkg(output, targets) {
  function defaultTarget() {
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
    const version = `node${process.version[1]}`;
    const platform = PLATFORMS[process.platform];
    const arch = ARCHITECTURES[process.arch];
    return `${version}-${platform}-${arch}`;
  }

  targets = targets || [];
  const command = ["pkg", ".", "--out-path", output];

  if (targets.length === 0) {
    targets.push(defaultTarget());
  }
  if (targets.length > 0) {
    command.push("--targets");
    command.push(targets.join(","));
  }

  return shell(command.join(" "));
}

// Clean compiled files.
Sparky.task("clean", () => {
  return clean(config.package.path, [
    // Root files.
    "coverage",
    "*.tgz",
    "*.log",
    // Compiled files.
    "dist",
    "build",
  ]);
});

// Clean and remove Node modules.
Sparky.task("distclean", ["clean"], () => {
  return clean(config.package.path, ["node_modules"]);
});

// Run linter.
Sparky.task("lint", () => {
  return shell("tslint -c tslint.json -p tsconfig.json --type-check");
});

Sparky.task("pre-start", () => {
  config.cli.pkg = false;
});

Sparky.task("pre-build", () => {
  config.cli.pkg = true;
});

// Configure bundles.
Sparky.task("configure", () => {
  Object.keys(config.bundles).map((key) => {
    const options = config.bundles[key];

    // Packaged directories when building 'pkg' binary.
    const pkgAssetPath = `/snapshot/${config.package.json.name}/assets`;
    const pkgScriptPath = `/snapshot/${config.package.json.name}/dist/scripts`;

    const fuse = FuseBox.init({
      homeDir: "src",
      output: `dist/${options.output}`,
      target: "server",
      cache: !config.cli.production,
      sourceMaps: !config.cli.production,
      tsConfig: "tsconfig.json",
      plugins: [
        TypeScriptHelpers(),
        BannerPlugin("// Application banner"),
        EnvPlugin({
          APP_NAME: config.package.json.name,
          APP_VERSION: config.package.json.version,
          APP_ENV: config.cli.production ? "production" : "development",
          // Packaged directories based on build configuration.
          ASSET_PATH: config.cli.pkg ? pkgAssetPath : path.resolve(__dirname, "assets"),
          SCRIPT_PATH: config.cli.pkg ? pkgScriptPath : path.resolve(__dirname, "dist", "scripts"),
        }),
        config.cli.production && UglifyJSPlugin({
          mangle: { reserved: ["require"] },
        }),
      ],
    });
    const bundle = fuse.bundle(options.name)
      .instructions(` > [${options.target}]`);

    options.fuse = fuse;
    options.bundle = bundle;
  });
});

// Start application.
Sparky.task("start", ["clean", "pre-start", "configure"], () => {
  config.bundles.server.bundle.watch();
  config.bundles.main.bundle.watch()
    .completed(proc => proc.start());

  return Promise.all([
    config.bundles.main.fuse.run(),
    config.bundles.server.fuse.run(),
  ]);
});

// Build application binary.
Sparky.task("build", ["clean", "pre-build", "configure"], () => {
  return Promise.all([
    config.bundles.main.fuse.run(),
    config.bundles.server.fuse.run(),
  ])
    .then(() => pkg("build", []));
});
