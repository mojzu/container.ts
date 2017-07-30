/// <reference types="node" />
import * as restify from "restify";
import { AwilixContainer } from "awilix";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/bindNodeCallback";
import "rxjs/add/operator/do";
import { IContainerModuleOpts, ContainerModule, IMetricTags } from "../container";
import { Validate } from "../lib/validate";

/** Restify server information interface. */
export interface IRestifyServerInformation {
  name: string;
  url: string;
  versions: string[];
  acceptable: string[];
}

/** Restify server request wrapper. */
export interface IServerRequest extends restify.Request {
  scope: AwilixContainer;
}

/** Restify server response wrapper. */
export interface IServerResponse extends restify.Response { }

export class RestifyServer extends ContainerModule {

  /** Default routes version. */
  public static DEFAULT_VERSION = "1.0.0";

  /** Environment variable names. */
  public static ENV = {
    /** Restify server port (required). */
    PORT: "RESTIFY_SERVER_PORT",
    /** Restify server port (optional). */
    PATH: "RESTIFY_SERVER_PATH",
  };

  /** Log names. */
  public static LOG = {
    START: "RestifyServerStart",
    STOP: "RestifyServerStop",
  };

  /** Metric names. */
  public static METRIC = {
    ERROR: "RestifyServerError",
    CONNECTION: "RestifyServerConnection",
    LISTENING: "RestifyServerError",
    CLOSE: "RestifyServerClose",
    RESPONSE_OK: "RestifyServerResponseOk",
    RESPONSE_CLIENT_ERROR: "RestifyServerResponseClientError",
    RESPONSE_SERVER_ERROR: "RestifyServerResponseServerError",
    RESPONSE_TIME: "RestifyServerResponseTime",
  };

  private _port: number;
  private _path: string;
  private _server: restify.Server;

  public get port(): number { return this._port; }
  public get path(): string { return this._path; }
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

    // Get port and path environment values.
    this._port = Validate.isPort(this.environment.get(RestifyServer.ENV.PORT));
    this._path = Validate.isString(this.environment.get(RestifyServer.ENV.PATH), { empty: true });
    this.debug(`${RestifyServer.ENV.PORT}="${this.port}"`);
    this.debug(`${RestifyServer.ENV.PATH}="${this.path}"`);

    // Create Restify server with empty name and default version.
    this._server = restify.createServer({ name: "", version: RestifyServer.DEFAULT_VERSION });

    // Register server event handler(s).
    this._server.on("error", this.handleServerError.bind(this));
    this._server.on("connection", this.handleServerConnection.bind(this));

    // Register Restify event handler(s).
    this._server.on("after", this.handlePostRequest.bind(this));

    // Pre-routing request handler(s).
    this._server.pre(restify.plugins.pre.sanitizePath());
    this._server.pre(this.handlePreRequest.bind(this));

    // Restify bundled plugin request handler(s).
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
    this.metric.increment(RestifyServer.METRIC.ERROR);
    this.log.error(error);
  }

  protected handleServerConnection(): void {
    this.metric.increment(RestifyServer.METRIC.CONNECTION);
  }

  protected handleServerListening(): void {
    this.metric.increment(RestifyServer.METRIC.LISTENING);
    this.log.info(RestifyServer.LOG.START, this.information);
  }

  protected handleServerClose(): void {
    this.metric.increment(RestifyServer.METRIC.CLOSE);
    this.log.info(RestifyServer.LOG.STOP);
  }

  protected handlePreRequest(req: IServerRequest, res: IServerResponse, next: restify.Next): void {
    // Create container scope on request.
    req.scope = this.container.createScope();
    req.scope.registerValue(RestifyServer.METRIC.RESPONSE_TIME, new Date());
    return next();
  }

  protected handlePostRequest(req: IServerRequest, res: IServerResponse, route?: restify.Route, error?: any): void {
    // Metric tags/log metadata.
    const tags: IMetricTags = { method: req.method, path: req.path(), status: res.statusCode };
    if (route != null) {
      tags.name = route.name;
    }
    if (error != null) {
      tags.error = error.name;
    }

    // Emit response status code category metric.
    // TODO: Status code enumeration.
    if (res.statusCode < 400) {
      this.metric.increment(RestifyServer.METRIC.RESPONSE_OK, 1, tags);
    } else if (res.statusCode < 500) {
      this.metric.increment(RestifyServer.METRIC.RESPONSE_CLIENT_ERROR, 1, tags);
    } else {
      this.metric.increment(RestifyServer.METRIC.RESPONSE_SERVER_ERROR, 1, tags);

      // Log errors if server error.
      if (error != null) {
        this.log.error(error, tags);
      }
    }

    // Emit response time metric.
    const value = req.scope.resolve<Date>(RestifyServer.METRIC.RESPONSE_TIME);
    this.metric.timing(RestifyServer.METRIC.RESPONSE_TIME, value, tags);
  }

  // TODO: ServerController
  // TODO: registerController

}
