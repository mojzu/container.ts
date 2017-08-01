/// <reference types="node" />
import * as restify from "restify";
import * as errors from "restify-errors";
import { AwilixContainer } from "awilix";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/bindNodeCallback";
import "rxjs/add/operator/do";
import {
  IContainerModuleOpts,
  IContainerModuleDepends,
  ContainerModule,
  IMetricTags,
} from "../../container";
import {
  Validate,
  ISchemaMap,
  ISchemaConstructor,
  buildSchema,
} from "../../lib/validate";
import { EServerMethod, EServerStatus } from "../Server";

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
  urlParameters<T>(): T;
  queryParameters<T>(): T;
  bodyData<T>(): T;
}

/** Restify server response wrapper. */
export interface IServerResponse extends restify.Response { }

/** Restify server request schema options. */
export interface IServerSchemaOptions<T> {
  url?: T;
  query?: T;
  body?: T;
  response: T;
}

/** Restify server route options. */
export interface IServerRouteOptions {
  name: string;
  path: string[];
  version?: string;
  versions?: string[];
  schema: IServerSchemaOptions<ISchemaMap>;
}

/** Restify server route handler. */
export type ServerRouteHandler<T> = (req: IServerRequest, res: IServerResponse) => Promise<T>;

/** Restify server request options. */
export interface IServerRequestOptions {
  schema: IServerSchemaOptions<ISchemaConstructor>;
}

/** Restify server route parts. */
export type ServerRoute = [restify.RouteOptions, restify.RequestHandler[]];

/** Restify server controller abstract class. */
export abstract class RestifyServerController extends ContainerModule {
  private _server: RestifyServer;
  public get server(): RestifyServer { return this._server; }
  public constructor(name: string, opts: IContainerModuleOpts, depends?: IContainerModuleDepends) {
    super(name, opts, Object.assign({ _server: RestifyServer.name }, depends));
  }
}

export class RestifyServer extends ContainerModule {

  /** Default routes version. */
  public static DEFAULT_VERSION = "1.0.0";

  /** Environment variable names. */
  public static ENV = {
    /** Restify server port (required). */
    PORT: "RESTIFY_SERVER_PORT",
    /** Restify server port (optional). */
    PATH: "RESTIFY_SERVER_PATH",
    /** Restify server throttle rate (default 50). */
    THROTTLE_RATE: "RESTIFY_SERVER_THROTTLE_RATE",
    /** Restify server throttle burst (default 100). */
    THROTTLE_BURST: "RESTIFY_SERVER_THROTTLE_BURST",
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
    LISTENING: "RestifyServerListening",
    CLOSE: "RestifyServerClose",
    RESPONSE_OK: "RestifyServerResponseOk",
    RESPONSE_CLIENT_ERROR: "RestifyServerResponseClientError",
    RESPONSE_SERVER_ERROR: "RestifyServerResponseServerError",
    RESPONSE_TIME: "RestifyServerResponseTime",
  };

  /** Scope value names. */
  public static SCOPE = {
    URL_PARAMETERS: "urlParameters",
    QUERY_PARAMETERS: "queryParameters",
    BODY_DATA: "bodyData",
  };

  private _port: number;
  private _path: string;
  private _throttleRate: number;
  private _throttleBurst: number;
  private _server: restify.Server;

  public get port(): number { return this._port; }
  public get path(): string { return this._path; }
  public get throttleRate(): number { return this._throttleRate; }
  public get throttleBurst(): number { return this._throttleBurst; }
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
    this.debug(`${RestifyServer.ENV.PORT}="${this.port}"`);

    this._path = Validate.isString(this.environment.get(RestifyServer.ENV.PATH), { empty: true });
    this.debug(`${RestifyServer.ENV.PATH}="${this.path}"`);

    // Get rate and burst environment values.
    const throttleRate = this.environment.get(RestifyServer.ENV.THROTTLE_RATE) || "50";
    this._throttleRate = Validate.isInteger(throttleRate, { min: 0 });
    this.debug(`${RestifyServer.ENV.THROTTLE_RATE}="${this.throttleRate}"`);

    const throttleBurst = this.environment.get(RestifyServer.ENV.THROTTLE_BURST) || "100";
    this._throttleBurst = Validate.isInteger(throttleBurst, { min: 0 });
    this.debug(`${RestifyServer.ENV.THROTTLE_BURST}="${this.throttleBurst}"`);

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
    // TODO: Support more Restify bodyParser plugin options.
    // TODO: CORS middleware with options.
    this._server.use(restify.plugins.acceptParser(this._server.acceptable));
    this._server.use(restify.plugins.dateParser());
    this._server.use(restify.plugins.queryParser({ mapParams: false }));
    this._server.use(restify.plugins.bodyParser({ mapParams: false }));
    this._server.use(restify.plugins.throttle({
      rate: this.throttleRate,
      burst: this.throttleBurst,
      xff: true,
    }));
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

  public get<T>(options: IServerRouteOptions, handler: ServerRouteHandler<T>): void {
    const [routeOptions, routeHandlers] = this.buildRoute<T>(EServerMethod.GET, options, handler);
    this._server.get(routeOptions, ...routeHandlers);
  }

  public head<T>(options: IServerRouteOptions, handler: ServerRouteHandler<T>): void {
    const [routeOptions, routeHandlers] = this.buildRoute<T>(EServerMethod.HEAD, options, handler);
    this._server.head(routeOptions, ...routeHandlers);
  }

  public post<T>(options: IServerRouteOptions, handler: ServerRouteHandler<T>): void {
    const [routeOptions, routeHandlers] = this.buildRoute<T>(EServerMethod.POST, options, handler);
    this._server.post(routeOptions, ...routeHandlers);
  }

  public put<T>(options: IServerRouteOptions, handler: ServerRouteHandler<T>): void {
    const [routeOptions, routeHandlers] = this.buildRoute<T>(EServerMethod.PUT, options, handler);
    this._server.put(routeOptions, ...routeHandlers);
  }

  public delete<T>(options: IServerRouteOptions, handler: ServerRouteHandler<T>): void {
    const [routeOptions, routeHandlers] = this.buildRoute<T>(EServerMethod.DELETE, options, handler);
    this._server.del(routeOptions, ...routeHandlers);
  }

  public options<T>(options: IServerRouteOptions, handler: ServerRouteHandler<T>): void {
    const [routeOptions, routeHandlers] = this.buildRoute<T>(EServerMethod.OPTIONS, options, handler);
    this._server.opts(routeOptions, ...routeHandlers);
  }

  public patch<T>(options: IServerRouteOptions, handler: ServerRouteHandler<T>): void {
    const [routeOptions, routeHandlers] = this.buildRoute<T>(EServerMethod.PATCH, options, handler);
    this._server.patch(routeOptions, ...routeHandlers);
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
    req.scope.registerValue(RestifyServer.METRIC.RESPONSE_TIME, Date.now());

    // Getters for scope values.
    Object.keys(RestifyServer.SCOPE).map((key) => {
      const target = RestifyServer.SCOPE[key];
      req[target] = req.scope.resolve.bind(req.scope, target);
    });

    return next();
  }

  protected handleRequestSchema(options: IServerRequestOptions): restify.RequestHandler {
    return (req: IServerRequest, res: IServerResponse, next: restify.Next) => {
      try {
        // Perform URL, query and body validation using schemas.
        if (options.schema.url != null) {
          const data = options.schema.url.validate(req.params);
          req.scope.registerValue(RestifyServer.SCOPE.URL_PARAMETERS, data);
        }
        if (options.schema.query != null) {
          const data = options.schema.query.validate(req.query);
          req.scope.registerValue(RestifyServer.SCOPE.QUERY_PARAMETERS, data);
        }
        if (options.schema.body != null) {
          const data = options.schema.body.validate(req.body);
          req.scope.registerValue(RestifyServer.SCOPE.BODY_DATA, data);
        }
        return next();
      } catch (error) {
        this.debug(error);
        return next(new errors.BadRequestError(error));
      }
    };
  }

  protected handleRequest<T>(options: IServerRequestOptions, handler: ServerRouteHandler<T>): restify.RequestHandler {
    return (req: IServerRequest, res: IServerResponse, next: restify.Next) => {
      handler(req, res)
        .then((data) => {
          // Apply schema format rules.
          data = options.schema.response.format<T>(data);
          res.send(data);
          next();
        })
        .catch((error) => {
          this.debug(error);
          next(error);
        });
    };
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
    if (res.statusCode < EServerStatus.BAD_REQUEST) {
      this.metric.increment(RestifyServer.METRIC.RESPONSE_OK, 1, tags);
    } else if (res.statusCode < EServerStatus.INTERNAL_SERVER_ERROR) {
      this.metric.increment(RestifyServer.METRIC.RESPONSE_CLIENT_ERROR, 1, tags);
    } else {
      this.metric.increment(RestifyServer.METRIC.RESPONSE_SERVER_ERROR, 1, tags);
      // Log errors if server error.
      if (error != null) {
        this.log.error(error, tags);
      }
    }

    // Emit response time metric.
    const value = Date.now() - req.scope.resolve<number>(RestifyServer.METRIC.RESPONSE_TIME);
    this.metric.timing(RestifyServer.METRIC.RESPONSE_TIME, value, tags);
  }

  protected buildRoute<T>(
    method: EServerMethod,
    options: IServerRouteOptions,
    handler: ServerRouteHandler<T>,
  ): ServerRoute {
    const requestOptions: IServerRequestOptions = {
      schema: {
        // Default empty schema for responses.
        response: buildSchema(),
      },
    };

    // Build request schema classes.
    Object.keys(options.schema).map((key) => {
      if (options.schema[key] != null) {
        requestOptions.schema[key] = buildSchema(options.schema[key]);
      }
    });

    // Restify route options.
    const routeOptions: restify.RouteOptions = {
      name: options.name,
      path: this.joinPath(...options.path),
    };
    if (options.version != null) {
      routeOptions.version = options.version;
    }
    if (options.versions != null) {
      routeOptions.versions = options.versions;
    }

    // Prepend default handlers to request.
    const routeHandlers: restify.RequestHandler[] = [
      this.handleRequestSchema(requestOptions),
      this.handleRequest<T>(requestOptions, handler),
    ];

    this.debugRoute(method, routeOptions);
    return [routeOptions, routeHandlers];
  }

  protected debugRoute(method: EServerMethod, route: restify.RouteOptions): void {
    this.debug(`${EServerMethod[method]} NAME="${route.name}" PATH="${route.path}"`);
  }

  /** Join URL segments and remove duplicate '/' characters. */
  protected joinPath(...parts: string[]): string {
    const output = ["/", this.path, "/"];
    output.push(parts.join("/"));
    output.push("/");
    return output.join("/").replace(/(\/\/+)/g, "/");
  }

}
