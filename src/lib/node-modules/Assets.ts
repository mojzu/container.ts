import { readFile } from "fs";
import { assign } from "lodash";
import { resolve } from "path";
import { IModuleOptions, Module } from "../../container";
import { ErrorChain } from "../error";
import { isDirectory, isFile } from "../node-validate";
import { Observable } from "./RxJS";

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
    PATH: "ASSETS_PATH",
  };

  /** Error names. */
  public static readonly ERROR = assign({}, Module.ERROR, {
    READ_FILE: "Assets.ReadFileError",
    JSON_PARSE: "Assets.JsonParseError",
  });

  protected readonly assetsPath = isDirectory(this.environment.get(Assets.ENV.PATH));
  protected readonly assetsCache: IAssetsCache = {};

  public constructor(options: IModuleOptions) {
    super(options);

    // Debug environment variables.
    this.debug(`${Assets.ENV.PATH}="${this.assetsPath}"`);
  }

  /** Returns true if target file is cached. */
  public isCached(target: string, encoding?: string): boolean {
    const cacheKey = `${target}:${encoding}`;
    return (this.assetsCache[cacheKey] != null);
  }

  // Overload signature for correct return types.
  public readFile(target: string, options?: { cache?: boolean }): Promise<Buffer>;
  public readFile(target: string, options: IAssetsReadOptions): Promise<string>;

  /**
   * Read asset file contents.
   * If encoding is specified a string is returned, else a Buffer.
   */
  public readFile(target: string, options: IAssetsReadOptions = { cache: true }): Promise<Buffer | string> {
    return this.assetsRead<Buffer | string>(target, options);
  }

  /** Read asset file contents and parse JSON object. */
  public readJson<T>(target: string, options: IAssetsReadOptions = { encoding: "utf8", cache: true }): Promise<T> {
    return Observable.fromPromise(this.assetsRead<string>(target, options))
      .map((data) => {
        try {
          return JSON.parse(data);
        } catch (error) {
          throw new AssetsError(Assets.ERROR.JSON_PARSE, target, error);
        }
      })
      .toPromise();
  }

  protected async assetsRead<T extends string | Buffer>(target: string, options: IAssetsReadOptions = {}): Promise<T> {
    const cacheKey = `${target}:${options.encoding}`;

    // Assets are read only, if contents defined in cache, return now.
    if (!!options.cache) {
      if (this.assetsCache[cacheKey] != null) {
        const value: T = this.assetsCache[cacheKey] as any;
        return value;
      }
    }

    try {
      // Check file exists, read file contents asynchronously.
      const filePath = isFile(resolve(this.assetsPath, target));
      const readFileCallback = (callback: any) => readFile(filePath, options.encoding, callback);
      const readFileBind = Observable.bindNodeCallback<T>(readFileCallback);

      return await readFileBind()
        .do((data) => {
          // Save to cache if enabled in options.
          if (!!options.cache) {
            this.assetsCache[cacheKey] = data;
          }
        })
        .toPromise();
    } catch (error) {
      throw new AssetsError(Assets.ERROR.READ_FILE, target, error);
    }
  }

}
