import * as assert from "assert";
import { EAssetsEnv, ELogsEnv, EProcessEnv, EScriptsEnv } from "container.ts/lib/node/modules";
import { mkdirSync } from "fs";
import * as fuseBox from "fuse-box";
import * as path from "path";
import { argv } from "yargs";
import { EStatsdMetricsEnv } from "./src/modules/statsd-metrics";
import * as tools from "./tools";
const packageJson = require("./package.json");

interface IConf {
  cli: { name: string; version: string; production: boolean; environment: string; pkg: string | boolean };
  targets: { [name: string]: { output: string; target: string } };
}

/** Current working directory. */
const CWD = path.resolve(__dirname);

/** Build configuration. */
const CONF: IConf = {
  /** Command line arguments. */
  cli: {
    /** Name flag to override package name. */
    name: argv.n || argv.name || packageJson.name,
    /** Version flag to override package version. */
    version: argv.v || argv.version || packageJson.version,
    /** Production flag for uglifying output. */
    production: argv.p || argv.production || false,
    /** Environment target argument to set default variables. */
    environment: argv.e || argv.environment || "development",
    /** Pkg build target, defaults to host platform. */
    pkg: argv.pkg || false
  },
  /** Configured targets. */
  targets: {
    /** Main process target. */
    main: {
      output: "$name.js",
      target: "main.ts"
    },
    /** Worker process script target. */
    worker: {
      output: "scripts/$name.js",
      target: "scripts/worker.ts"
    }
  }
};

/** Environment targets. */
const ENV = {
  /** Local development. */
  development: {
    [ELogsEnv.Level]: "info",
    [EStatsdMetricsEnv.Host]: "localhost"
  }
};

function environmentVariables(target: string) {
  assert(ENV[target] != null, "Target environment not defined in `fuse.ts`...");
  return ENV[target] || {};
}

function configureBundle(name: string, target: { output: string; target: string }): [fuseBox.FuseBox, fuseBox.Bundle] {
  // If using pkg to build, cli.pkg will be defined.
  const targetPkg = CONF.cli.pkg !== false;

  // Packaged directories when building 'pkg' binary.
  const dirname = path.basename(__dirname);
  const pkgAssetsPath = `/snapshot/${dirname}/assets`;
  const pkgScriptsPath = `/snapshot/${dirname}/dist/scripts`;

  // Default relative paths during development.
  const assetsPath = path.resolve(CWD, "assets");
  const scriptsPath = path.resolve(CWD, "dist", "scripts");

  // Environment plugin configuration.
  const env = {
    // Environment target variables.
    ...environmentVariables(CONF.cli.environment),
    // Environment variable defaults.
    [EProcessEnv.Name]: CONF.cli.name,
    [EProcessEnv.Version]: CONF.cli.version,
    [EProcessEnv.NodeEnv]: CONF.cli.production ? "production" : "development",
    // Directory locations based on build configuration.
    [EAssetsEnv.Path]: targetPkg ? pkgAssetsPath : assetsPath,
    [EScriptsEnv.Path]: targetPkg ? pkgScriptsPath : scriptsPath
  };
  console.log(env); // tslint:disable-line

  // FuseBox plugins.
  const fusePlugins: fuseBox.Plugin[] = [fuseBox.EnvPlugin(env)];

  // If production flag set, use uglify plugin.
  // If 'require' is mangled then 'pkg' can't find 'node_modules'.
  if (CONF.cli.production) {
    fusePlugins.push(
      fuseBox.UglifyJSPlugin({
        mangle: { reserved: ["require"] }
      })
    );
  }

  const fuse = fuseBox.FuseBox.init({
    homeDir: "src",
    output: `dist/${target.output}`,
    cache: !CONF.cli.production,
    sourceMaps: !CONF.cli.production,
    target: "server",
    plugins: fusePlugins
  });
  const bundle = fuse.bundle(name).instructions(` > [${target.target}]`);

  return [fuse, bundle];
}

function configureTargets() {
  // Main, worker targets.
  const [mainFuse, mainBundle] = configureBundle("main", CONF.targets.main);
  const [workerFuse, workerBundle] = configureBundle("worker", CONF.targets.worker);
  const pkgTargets = [];
  if (typeof CONF.cli.pkg === "string") {
    pkgTargets.push(CONF.cli.pkg);
  }
  return {
    main: { fuse: mainFuse, bundle: mainBundle, pkg: pkgTargets },
    worker: { fuse: workerFuse, bundle: workerBundle }
  };
}

fuseBox.Sparky.task("clean", () => {
  return tools.clean(CWD, [".fusebox", "coverage", "dist", "*.log", "*.tgz"]);
});

fuseBox.Sparky.task("distclean", ["clean"], () => {
  return tools.clean(CWD, ["node_modules"]);
});

fuseBox.Sparky.task("lint", () => {
  return tools.shell("tslint -c tslint.json -p tsconfig.json", CWD);
});

fuseBox.Sparky.task("tsc", ["clean"], () => {
  return tools.shell("tsc", CWD);
});

// Create required application directories.
fuseBox.Sparky.task("mkdir", () => {
  mkdirSync(path.resolve(CWD, "dist"));
});

fuseBox.Sparky.task("test", ["clean", "mkdir"], () => {
  return tools.shell("jest --coverage", CWD);
});

// Watch and run main process bundle.
fuseBox.Sparky.task("start", ["clean", "mkdir"], () => {
  const targets = configureTargets();
  let previousProc: any;

  // Watch all bundles during development.
  targets.worker.bundle.watch();
  // Start the main bundle on rebuild.
  // Clean up previously started processes on rebuild.
  // TODO(L): Should it be necessary to kill processes here?
  targets.main.bundle.watch().completed((proc) => {
    if (previousProc != null) {
      previousProc.kill();
    }
    previousProc = proc.start();
  });

  process.on("SIGINT", () => {
    if (previousProc != null) {
      previousProc.kill();
    }
    process.exit(0);
  });

  return Promise.all([targets.main.fuse.run(), targets.worker.fuse.run()]);
});

// Run main bundle and build binary distribution.
fuseBox.Sparky.task("dist", ["clean"], () => {
  // Configure `pkg` argument if distribution.
  CONF.cli.pkg = CONF.cli.pkg === false ? true : CONF.cli.pkg;
  const targets = configureTargets();

  return Promise.all([targets.main.fuse.run(), targets.worker.fuse.run()]).then(() =>
    tools.pkg(CWD, "dist/bin", targets.main.pkg)
  );
});
