/// <reference types="node" />
import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/observable/throw";
import "rxjs/add/observable/bindNodeCallback";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import { IContainerModuleOpts, ContainerModule } from "../../container";

/** Assets files cached when read. */
export interface IAssetsCache {
  [key: string]: Buffer | string | object;
}

// TODO: Split caches.
// TODO: Validation library.
export const ENV_ASSETS_PATH = "ASSETS_PATH";

/** Assets read only files interface. */
export class Assets extends ContainerModule {

  private _path: string;
  private _cache: IAssetsCache = {};

  public get path(): string { return this._path; }
  public get cache(): IAssetsCache { return this._cache; }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get assets directory path from environment.
    const assetsPath = this.environment.get(ENV_ASSETS_PATH);
    assert(assetsPath != null, "Assets path is undefined");
    this._path = path.resolve(assetsPath);
    this.debug(`path '${this.path}'`);
  }

  /** Overload signature for correct return types. */
  public readFile(target: string): Observable<Buffer>;
  public readFile(target: string, encoding?: string): Observable<string>;

  /** Read assets file contents with optional encoding. */
  public readFile(target: string, encoding?: string): Observable<Buffer | string> {
    return this.read<Buffer | string>(target, encoding)
      .do((data) => {
        // Save to cache.
        this.cache[target] = data;
      });
  }

  /** Read assets file contents and parse JSON object. */
  public readJson(target: string, encoding = "utf8"): Observable<object> {
    return this.read<string>(target, encoding)
      .map((data) => {
        try {
          // Parse JSON and save to cache.
          const json = JSON.parse(data);
          this.cache[target] = json;
          return json;
        } catch (error) {
          return Observable.throw(error);
        }
      });
  }

  /** Read assets file contents. */
  protected read<T>(target: string, encoding?: string): Observable<T> {
    // Assets are read only, if contents defined in cache, return now.
    if (this.cache[target] != null) {
      const value: T = this.cache[target] as any;
      return Observable.of(value);
    }

    // Read file contents asynchronously.
    const filePath = path.resolve(this.path, target);
    const readFileCallback = fs.readFile.bind(this, filePath, encoding);
    const readFile: () => Observable<T> = Observable.bindNodeCallback(readFileCallback);
    return readFile();
  }

}