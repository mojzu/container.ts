import { readdir, readFile } from "fs";
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

/** Assets environment variable names. */
export enum EAssetsEnv {
  /** Assets directory path (required). */
  Path = "ASSETS_PATH"
}

/** Assets error names. */
export enum EAssetsError {
  ReadFile = "AssetsError.ReadFile",
  JsonParse = "AssetsError.JsonParse",
  ReadDirectory = "AssetsError.ReadDirectory"
}

/** Assets read only files module. */
export class Assets extends Module {
  /** Default module name. */
  public static readonly moduleName: string = "Assets";

  /** Absolute path to assets files directory. */
  public readonly envPath = isDirectory(this.environment.get(EAssetsEnv.Path));

  /** Internal assets cache. */
  protected readonly assetsCache: IAssetsCache = {};

  public constructor(options: IModuleOptions) {
    super(options);

    // Debug environment variables.
    this.debug(`${EAssetsEnv.Path}="${this.envPath}"`);
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
      throw new AssetsError(EAssetsError.JsonParse, target, error);
    }
  }

  /** Read contents of assets directory. */
  public async readDirectory(target: string = ""): Promise<string[]> {
    try {
      const directoryPath = isDirectory(resolve(this.envPath, target));
      const fsReaddir = promisify(readdir);
      return await fsReaddir(directoryPath);
    } catch (error) {
      throw new AssetsError(EAssetsError.ReadDirectory, target, error);
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
      const filePath = isFile(resolve(this.envPath, target));
      const fsReadFile = promisify(readFile);
      const data = await fsReadFile(filePath, options.encoding);

      // Save to cache if enabled in options.
      if (!!options.cache) {
        this.assetsCache[cacheKey] = data;
      }
      return data;
    } catch (error) {
      throw new AssetsError(EAssetsError.ReadFile, target, error);
    }
  }
}
