import { readdir, readFile } from "fs";
import { assign } from "lodash";
import { resolve } from "path";
import { promisify } from "util";
import { IModuleOptions, Module } from "../../../container";
import { ErrorChain } from "../../error";
import { isDirectory, isFile } from "../validate";

/** Assets files may be cached when read. */
export interface IAssetsCache {
  [key: string]: Buffer | string;
}

/** Assets error class. */
export class AssetsError extends ErrorChain {
  public constructor(name: string, value: string, cause?: Error) {
    super({ name, value }, cause);
  }
}

/** Assets file read options. */
export interface IAssetsReadOptions {
  encoding?: string;
  cache?: boolean;
}

/** Assets read only files module. */
export class Assets extends Module {
  /** Default module name. */
  public static readonly moduleName: string = "Assets";

  /** Environment variable names. */
  public static readonly ENV = {
    /** Assets directory path (required). */
    PATH: "ASSETS_PATH"
  };

  /** Error names. */
  public static readonly ERROR = assign({}, Module.ERROR, {
    READ_FILE: "Assets.ReadFileError",
    JSON_PARSE: "Assets.JsonParseError",
    READ_DIRECTORY: "Assets.ReadDirectoryError"
  });

  /** Absolute path to assets files directory. */
  public readonly path = isDirectory(this.environment.get(Assets.ENV.PATH));

  /** Internal assets cache. */
  protected readonly assetsCache: IAssetsCache = {};

  public constructor(options: IModuleOptions) {
    super(options);

    // Debug environment variables.
    this.debug(`${Assets.ENV.PATH}="${this.path}"`);
  }

  /** Returns true if target file is cached. */
  public isCached(target: string, encoding?: string): boolean {
    const cacheKey = `${target}:${encoding}`;
    return this.assetsCache[cacheKey] != null;
  }

  // Overload signature for correct return types.
  public readFile(target: string, options?: { cache?: boolean }): Promise<Buffer>;
  public readFile(target: string, options: IAssetsReadOptions): Promise<string>;

  /**
   * Read asset file contents.
   * If encoding is specified a string is returned, else a Buffer.
   */
  public readFile(target: string, options: IAssetsReadOptions = { cache: true }): Promise<Buffer | string> {
    return this.assetsRead(target, options);
  }

  /** Read asset file contents and parse JSON object. */
  public async readJson<T>(
    target: string,
    options: IAssetsReadOptions = { encoding: "utf8", cache: true }
  ): Promise<T> {
    const data = (await this.assetsRead(target, options)) as string;
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new AssetsError(Assets.ERROR.JSON_PARSE, target, error);
    }
  }

  /** Read contents of assets directory. */
  public async readDirectory(target: string = ""): Promise<string[]> {
    try {
      const directoryPath = isDirectory(resolve(this.path, target));
      const fsReaddir = promisify(readdir);
      return await fsReaddir(directoryPath);
    } catch (error) {
      throw new AssetsError(Assets.ERROR.READ_DIRECTORY, target, error);
    }
  }

  protected async assetsRead(target: string, options: IAssetsReadOptions = {}): Promise<string | Buffer> {
    // Assets are read only, if contents defined in cache, return now.
    const cacheKey = `${target}:${options.encoding}`;
    if (!!options.cache) {
      if (this.assetsCache[cacheKey] != null) {
        return this.assetsCache[cacheKey];
      }
    }

    try {
      // Check file exists, read file contents asynchronously.
      const filePath = isFile(resolve(this.path, target));
      const fsReadFile = promisify(readFile);
      const data = await fsReadFile(filePath, options.encoding);

      // Save to cache if enabled in options.
      if (!!options.cache) {
        this.assetsCache[cacheKey] = data;
      }
      return data;
    } catch (error) {
      throw new AssetsError(Assets.ERROR.READ_FILE, target, error);
    }
  }
}
