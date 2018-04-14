import { Assets, Process, Scripts } from "container.ts/lib/node/modules";
import * as fuseBox from "fuse-box";
import * as path from "path";
import { argv } from "yargs";
import * as tools from "./tools";
const packageJson = require("./package.json");

interface IConfig {
  cli: { name: string; version: string; production: boolean };
  package: { path: string; json: object };
  targetPkg: boolean;
  bundles: {
    [name: string]: {
      output: string;
      target: string;
      fuse?: fuseBox.FuseBox;
      bundle?: fuseBox.Bundle;
    };
  };
}

const CONFIG: IConfig = {
  /** Command line arguments. */
  cli: {
    /** Name flag to override package name. */
    name: argv.n || argv.name || packageJson.name,
    /** Version flag to override package version. */
    version: argv.v || argv.version || packageJson.version,
    /** Production flag for uglifying output. */
    production: argv.p || argv.production || false,
  },
  /** Package information. */
  package: {
    path: path.resolve(__dirname),
    json: packageJson,
  },
  /** Targeting 'pkg' build. */
  targetPkg: false,
  /** Configured bundles. */
  bundles: {
    /** Main process bundle. */
    main: {
      output: "$name.js",
      target: "main.ts",
    },
    /** Worker process script bundle. */
    worker: {
      output: "scripts/$name.js",
      target: "scripts/worker.ts",
    },
  },
};

/** Current working directory. */
const CWD = CONFIG.package.path;

fuseBox.Sparky.task("clean", () => {
  return tools.clean(CONFIG.package.path, [".fusebox", "coverage", "dist", "*.log", "*.tgz"]);
});

fuseBox.Sparky.task("distclean", ["clean"], () => {
  return tools.clean(CONFIG.package.path, ["node_modules"]);
});

fuseBox.Sparky.task("lint", () => {
  tools.shell("tslint -c tslint.json -p tsconfig.json", CWD);
});

fuseBox.Sparky.task("test", () => {
  tools.shell("jest --coverage", CWD);
});

fuseBox.Sparky.task("pre-start", () => {
  CONFIG.targetPkg = false;
});

fuseBox.Sparky.task("pre-dist", () => {
  CONFIG.targetPkg = true;
});

// Configure bundle(s).
fuseBox.Sparky.task("configure", () => {
  Object.keys(CONFIG.bundles).map((key) => {
    const target = CONFIG.bundles[key];

    // Packaged directories when building 'pkg' binary.
    const dirname = path.basename(__dirname);
    const pkgAssetPath = `/snapshot/${dirname}/assets`;
    const pkgScriptPath = `/snapshot/${dirname}/dist/scripts`;

    // Default relative paths during development.
    const assetPath = path.resolve(CONFIG.package.path, "assets");
    const scriptPath = path.resolve(CONFIG.package.path, "dist", "scripts");

    // FuseBox plugins.
    const fusePlugins: fuseBox.Plugin[] = [
      fuseBox.EnvPlugin({
        // Environment variable overrides.
        [Process.ENV.NAME]: CONFIG.cli.name,
        [Process.ENV.VERSION]: CONFIG.cli.version,
        [Process.ENV.NODE_ENV]: CONFIG.cli.production ? "production" : "development",
        // Directory locations based on build configuration.
        [Assets.ENV.PATH]: CONFIG.targetPkg ? pkgAssetPath : assetPath,
        [Scripts.ENV.PATH]: CONFIG.targetPkg ? pkgScriptPath : scriptPath,
      }),
    ];

    // If production flag set, use uglify plugin.
    // If 'require' is mangled then 'pkg' can't find 'node_modules'.
    if (CONFIG.cli.production) {
      fusePlugins.push(
        fuseBox.UglifyJSPlugin({
          mangle: { reserved: ["require"] },
        }),
      );
    }

    const fuse = fuseBox.FuseBox.init({
      homeDir: "src",
      output: `dist/${target.output}`,
      target: "server",
      cache: !CONFIG.cli.production,
      sourceMaps: !CONFIG.cli.production,
      tsConfig: "tsconfig.json",
      useTypescriptCompiler: true,
      plugins: fusePlugins,
    });

    const bundle = fuse.bundle(key).instructions(` > [${target.target}]`);

    target.fuse = fuse;
    target.bundle = bundle;
  });
});

// Watch bundles and run main process bundle.
fuseBox.Sparky.task("start", ["clean", "pre-start", "configure"], () => {
  return Promise.all(
    Object.keys(CONFIG.bundles).map((key) => {
      const target = CONFIG.bundles[key];
      if (!target.fuse || !target.bundle) {
        return Promise.resolve() as any;
      }

      // Watch all bundles during development.
      target.bundle.watch();

      // Start the main bundle on rebuild.
      // Clean up previously started processes on rebuild.
      // TODO(H): Should it be necessary to kill processes here?
      if (key === "main") {
        let previousProc: any;

        target.bundle.completed((proc) => {
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
      }

      return target.fuse.run();
    }),
  );
});

// Run bundles and build binary.
fuseBox.Sparky.task("dist", ["clean", "pre-dist", "configure"], () => {
  return Promise.all(
    Object.keys(CONFIG.bundles).map((key) => {
      const target = CONFIG.bundles[key];
      if (!target.fuse || !target.bundle) {
        return Promise.resolve() as any;
      }
      return target.fuse.run();
    }),
  ).then(() => tools.pkg(CONFIG.package.path, "dist/bin"));
});
