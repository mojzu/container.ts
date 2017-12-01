import * as fs from "fs";
import * as path from "path";
import { IModuleOpts, Module } from "../../container";
import { Observable } from "../../container/RxJS";
import { ErrorChain } from "../error";
import { NodeValidate } from "../node-validate";

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
  public static readonly ERROR = Object.assign({}, Module.ERROR, {
    READ_FILE: "AssetsReadFileError",
    JSON_PARSE: "AssetsJsonParseError",
  });

  protected readonly path = this.envPath;
  protected readonly cache: IAssetsCache = {};

  public constructor(opts: IModuleOpts) {
    super(opts);

    // Debug environment variables.
    this.debug(`${Assets.ENV.PATH}="${this.path}"`);
  }

  /** Returns true if target file is cached. */
  public isCached(target: string, encoding?: string): boolean {
    const cacheKey = `${target}:${encoding}`;
    return (this.cache[cacheKey] != null);
  }

  // Overload signature for correct return types.
  public readFile(target: string, options?: { cache?: boolean }): Observable<Buffer>;
  public readFile(target: string, options: IAssetsReadOptions): Observable<string>;

  /**
   * Read asset file contents.
   * If encoding is specified a string is returned, else a Buffer.
   * File is cached by default.
   */
  public readFile(target: string, options: IAssetsReadOptions = { cache: true }): Observable<Buffer | string> {
    return this.read<Buffer | string>(target, options);
  }

  /** Read asset file contents and parse JSON object. */
  public readJson<T>(target: string, options: IAssetsReadOptions = { encoding: "utf8", cache: true }): Observable<T> {
    return this.read<string>(target, options)
      .map((data) => {
        try {
          return JSON.parse(data);
        } catch (error) {
          throw new AssetsError(Assets.ERROR.JSON_PARSE, target, error);
        }
      });
  }

  protected get envPath(): string {
    return NodeValidate.isDirectory(path.resolve(this.environment.get(Assets.ENV.PATH)));
  }

  protected read<T extends string | Buffer>(target: string, options: IAssetsReadOptions = {}): Observable<T> {
    const cacheKey = `${target}:${options.encoding}`;

    // Assets are read only, if contents defined in cache, return now.
    if (!!options.cache) {
      if (this.cache[cacheKey] != null) {
        const value: T = this.cache[cacheKey] as any;
        return Observable.of(value);
      }
    }

    try {
      // Check file exists, read file contents asynchronously.
      const filePath = NodeValidate.isFile(path.resolve(this.path, target));
      const readFileCallback = fs.readFile.bind(this, filePath, options.encoding);
      const readFile = Observable.bindNodeCallback<T>(readFileCallback);

      return readFile()
        .do((data) => {
          if (!!options.cache) {
            // Save to cache if enabled in options.
            this.cache[cacheKey] = data;
          }
        });
    } catch (error) {
      return Observable.throw(new AssetsError(Assets.ERROR.READ_FILE, target, error));
    }
  }

}
