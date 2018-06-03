import * as fuseBox from "fuse-box";
import { shell } from "./shell";

const PLATFORMS = {
  linux: "linux",
  win32: "win",
  darwin: "macos"
};

const ARCHITECTURES = {
  x64: "x64",
  ia32: "x86",
  arm: "armv6"
};

function defaultTarget() {
  const version = `node${process.version[1]}`;
  const platform = PLATFORMS[process.platform];
  const arch = ARCHITECTURES[process.arch];
  return `${version}-${platform}-${arch}`;
}

/**
 * Package application into binary for host platform(s).
 * Targets host platform by default.
 */
export async function pkg(cwd: string, output: string, targets: string[] = []): Promise<void> {
  const command = ["pkg", ".", "--out-path", output];

  if (targets.length === 0) {
    targets.push(defaultTarget());
  }
  if (targets.length > 0) {
    command.push("--targets");
    command.push(targets.join(","));

    // Copy native modules to output directory.
    for (const target of targets) {
      await fuseBox.Sparky.src(`${__dirname}/native_modules/${target}/**/*.node`)
        .dest(output)
        .exec();
    }
  }

  return shell(command.join(" "), cwd);
}
