/// <reference types="node" />
import * as restify from "restify";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/bindNodeCallback";
import "rxjs/add/operator/do";
import { IContainerModuleOpts, ContainerModule } from "../../container";
import { Validate } from "../../lib/validate";

/** Restify server information interface. */
export interface IRestifyServerInformation {
  name: string;
  url: string;
  versions: string[];
  acceptable: string[];
}

/** Restify server request wrapper. */
export interface IServerRequest extends restify.Request { }

/** Restify server response wrapper. */
export interface IServerResponse extends restify.Response { }

/** Environment variable name for Restify server port (required). */
export const ENV_RESTIFY_PORT = "RESTIFY_PORT";

export class RestifyServer extends ContainerModule {

  private _port: number;
  private _server: restify.Server;

  public get port(): number { return this._port; }
  public get server(): restify.Server { return this._server; }

  public get information(): IRestifyServerInformation {
    return {
      name: this._server.name,
      url: this._server.url,
      versions: this._server.versions,
      acceptable: this._server.acceptable,
    };
  }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get port environment value.
    this._port = Validate.isPort(this.environment.get(ENV_RESTIFY_PORT));
    this.debug(`${ENV_RESTIFY_PORT}="${this.port}"`);

    // Create Restify server.
    this._server = restify.createServer({ name: "", version: "1.0.0" });

    // Register server event handlers.
    this._server.on("error", this.handleServerError.bind(this));
    this._server.on("connection", this.handleServerConnection.bind(this));

    // Register Restify event handlers.
    this._server.on("restifyError", this.handleServerRestifyError.bind(this));
    this._server.on("after", this.handlePostRequest.bind(this));

    // Pre-routing request handlers.
    this._server.pre(restify.plugins.pre.sanitizePath());
    this._server.pre(this.handlePreRequest.bind(this));

    // Restify bundled plugin request handlers.
    // TODO: Support more Restify bodyParser, throttle plugin options.
    this._server.use(restify.plugins.acceptParser(this._server.acceptable));
    this._server.use(restify.plugins.dateParser());
    this._server.use(restify.plugins.queryParser({ mapParams: false }));
    this._server.use(restify.plugins.bodyParser({ mapParams: false }));
    this._server.use(restify.plugins.throttle({ burst: 100, rate: 50, ip: true }));
  }

  public start(): Observable<void> {
    const listenCallback = this._server.listen.bind(this._server, this.port);
    const listen: () => Observable<void> = Observable.bindNodeCallback(listenCallback) as any;
    return listen().do(() => this.handleServerListening());
  }

  public stop(): void {
    // Do not wait for server close, causes timeout.
    this._server.close();
    this.handleServerClose();
  }

  protected handleServerError(error: any): void {
    this.metric.increment("RestifyServerError");
    this.log.error(error);
  }

  protected handleServerConnection(): void {
    this.metric.increment("RestifyServerConnection");
  }

  protected handleServerRestifyError(req: IServerRequest, res: IServerResponse, error: any, next: restify.Next): void {
    // TODO: Improve Restify error handler.
    this.metric.increment("RestifyServerError");
    this.log.error(error);
    res.send(error);
    return next();
  }

  protected handleServerListening(): void {
    this.metric.increment("RestifyServerListening");
    this.log.info("RestifyServerStart", this.information);
  }

  protected handleServerClose(): void {
    this.metric.increment("RestifyServerClose");
    this.log.info("RestifyServerStop");
  }

  protected handlePreRequest(req: IServerRequest, res: IServerResponse, next: restify.Next): void {
    return next();
  }

  protected handlePostRequest(req: IServerRequest, res: IServerResponse, route?: restify.Route, error?: any): void {
  }

}
