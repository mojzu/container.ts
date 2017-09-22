import * as path from "path";
import * as fs from "fs";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/throw";
import "rxjs/add/observable/bindNodeCallback";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import { ContainerModule } from "../container";
import { ErrorChain } from "../lib/error";
import { Validate } from "../lib/validate";

/** Asset files cached when read. */
export interface IAssetCache {
  [key: string]: Buffer | string;
}

/** Asset error class. */
export class AssetError extends ErrorChain {
  public constructor(name: string, value: string, cause?: Error) {
    super({ name, value }, cause);
  }
}

/** Assets read only files interface. */
export class Asset extends ContainerModule {

  /** Environment variable names. */
  public static ENV = {
    /** Asset directory path (required). */
    PATH: "ASSET_PATH",
  };

  /** Error names. */
  public static ERROR = {
    READ_FILE: "AssetReadFileError",
    JSON_PARSE: "AssetJsonParseError",
  };

  private _path: string;
  private _cache: IAssetCache = {};

  public get path(): string { return this._path; }
  public get cache(): IAssetCache { return this._cache; }

  public setup(): void {
    super.setup();

    // Get asset directory path from environment.
    const assetPath = path.resolve(this.environment.get(Asset.ENV.PATH));
    this._path = Validate.isDirectory(assetPath);
    this.debug(`${Asset.ENV.PATH}="${this.path}"`);
  }

  /** Overload signature for correct return types. */
  public readFile(target: string): Observable<Buffer>;
  public readFile(target: string, encoding?: string): Observable<string>;

  /** Read asset file contents with optional encoding. */
  public readFile(target: string, encoding?: string): Observable<Buffer | string> {
    return this.read<Buffer | string>(target, encoding)
      .do((data) => {
        this.cache[target] = data;
      });
  }

  /** Read asset file contents and parse JSON object. */
  public readJson(target: string, encoding = "utf8"): Observable<object> {
    return this.read<string>(target, encoding)
      .map((data) => {
        this.cache[target] = data;
        try {
          return JSON.parse(data);
        } catch (error) {
          return Observable.throw(new AssetError(Asset.ERROR.JSON_PARSE, target, error));
        }
      });
  }

  /** Read asset file contents. */
  protected read<T>(target: string, encoding?: string): Observable<T> {
    // Assets are read only, if contents defined in cache, return now.
    if (this.cache[target] != null) {
      const value: T = this.cache[target] as any;
      return Observable.of(value);
    }

    try {
      // Check file exists, read file contents asynchronously.
      const filePath = Validate.isFile(path.resolve(this.path, target));
      const readFileCallback = fs.readFile.bind(this, filePath, encoding);
      const readFile: () => Observable<T> = Observable.bindNodeCallback(readFileCallback);
      return readFile();
    } catch (error) {
      return Observable.throw(new AssetError(Asset.ERROR.READ_FILE, target, error));
    }
  }

}
