/// <reference types="node" />
import * as http from "http";
import * as socketio from "socket.io";
import { AwilixContainer } from "awilix";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/bindNodeCallback";
import "rxjs/add/observable/empty";
import "rxjs/add/operator/do";
import {
  IContainerModuleOpts,
  IContainerModuleDepends,
  ContainerModule,
} from "../../container";
import {
  Validate,
  ISchemaTypes,
  ISchemaConstructor,
  buildSchema,
} from "../../lib/validate";

/** SocketIO socket wrapper. */
export interface IServerSocket extends SocketIO.Socket {
  scope: AwilixContainer;
}

/** SocketIO server information interface. */
export interface ISocketioServerInformation {
  url: string;
  origins: string;
}

/** SocketIO event handler type. */
export type ISocketioServerHandler<T> = (socket: IServerSocket, data?: T) => Observable<any>;

/** SocketIO server event handler options interface. */
export interface ISocketioServerEventOptions<T> {
  event: string;
  schema: {
    request: T;
    response: T;
  };
}

/** SocketIO server registered event handlers. */
export interface ISocketioServerHandlers {
  [event: string]: {
    handler: ISocketioServerHandler<any>,
    options: ISocketioServerEventOptions<ISchemaTypes>,
  };
}

/** SocketIO server controller abstract class. */
export abstract class SocketioServerController extends ContainerModule {
  private _server: SocketioServer;
  public get server(): SocketioServer { return this._server; }
  public constructor(name: string, opts: IContainerModuleOpts, depends?: IContainerModuleDepends) {
    super(name, opts, Object.assign({ _server: SocketioServer.name }, depends));
  }
}

export class SocketioServer extends ContainerModule {

  /** Environment variable names. */
  public static ENV = {
    /** SocketIO server port (required). */
    PORT: "SOCKETIO_PORT",
  };

  /** Metric names. */
  public static METRIC = {
    ERROR: "SocketioServerError",
    CONNECTION: "SocketioServerConnection",
    DISCONNECT: "SocketioServerDisconnect",
    CLIENT_ERROR: "SocketioServerClientError",
    SERVER_ERROR: "SocketioServerServerError",
  };

  private _port: number;
  private _server: http.Server;
  private _io: SocketIO.Server;
  private _handlers: ISocketioServerHandlers = {};

  public get port(): number { return this._port; }
  public get server(): http.Server { return this._server; }
  public get io(): SocketIO.Server { return this._io; }
  public get handlers(): ISocketioServerHandlers { return this._handlers; }

  public get information(): ISocketioServerInformation {
    const address = this._server.address();
    const url = `http://[${address.address}]:${address.port}${this._io.path()}`;
    return { url, origins: this._io.origins() };
  }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get port environment value.
    this._port = Validate.isPort(this.environment.get(SocketioServer.ENV.PORT));
    this.debug(`${SocketioServer.ENV.PORT}="${this.port}"`);

    // TODO: Optional SocketIO path argument.
    this._server = http.createServer();
    this._io = socketio(this.server);

    // Register server event handlers.
    this._server.on("error", this.handleServerError.bind(this));
    this._server.on("connect", this.handleConnection.bind(this));

    // Register default socket handler(s).
    this.registerHandler({
      event: "disconnect",
      schema: { request: {}, response: {} },
    }, this.handleSocketDisconnect.bind(this));
  }

  public start(): Observable<void> {
    const listenCallback = this._server.listen.bind(this._server, this.port);
    const listen: () => Observable<void> = Observable.bindNodeCallback(listenCallback) as any;
    return listen()
      .do(() => {
        // Log server information.
        this.log.info("SocketioServerStart", this.information);
      });
  }

  public stop(): Observable<void> {
    const closeCallback = this._server.close.bind(this._server);
    const close: () => Observable<void> = Observable.bindNodeCallback(closeCallback) as any;
    return close()
      .do(() => {
        this.log.info("SocketioServerStop");
      });
  }

  public registerHandler<T>(
    options: ISocketioServerEventOptions<ISchemaTypes>,
    handler: ISocketioServerHandler<T>,
  ): void {
    this._handlers[options.event] = { handler, options };
  }

  public addHandler<T>(
    socket: IServerSocket,
    options: ISocketioServerEventOptions<ISchemaTypes>,
    handler: ISocketioServerHandler<T>,
  ): void {
    // Build schemas using options.
    const requestSchema = buildSchema(options.schema.request);
    const responseSchema = buildSchema(options.schema.response);
    const handlerOptions: ISocketioServerEventOptions<ISchemaConstructor> = {
      event: options.event,
      schema: {
        request: requestSchema,
        response: responseSchema,
      },
    };

    // Register wrapped event handler.
    socket.on(options.event, this.wrapHandler.bind(this, socket, handlerOptions, handler));
  }

  protected handleServerError(error: any): void {
    this.metric.increment(SocketioServer.METRIC.ERROR);
    this.log.error(error);
  }

  protected handleConnection(socket: IServerSocket): void {
    // TODO: Get metric tags from socket.
    this.metric.increment(SocketioServer.METRIC.CONNECTION);

    // Create container scope on request.
    socket.scope = this.container.createScope();

    // Add default handlers to socket.
    Object.keys(this.handlers).map((event) => {
      const handler = this.handlers[event];
      this.addHandler(socket, handler.options, handler.handler);
    });
  }

  protected handleSocketDisconnect(socket: IServerSocket): Observable<void> {
    this.metric.increment(SocketioServer.METRIC.DISCONNECT);
    return Observable.empty();
  }

  protected wrapHandler<T>(
    socket: IServerSocket,
    options: ISocketioServerEventOptions<ISchemaConstructor>,
    handler: ISocketioServerHandler<T>,
    requestData?: any,
  ): void {
    try {
      // Validate request data.
      const data = options.schema.request.validate<T>(requestData);

      // TODO: Metric collection on next/complete.
      // TODO: Check thrown error handling.
      // TODO: Add timeout support.
      handler(socket, data)
        .subscribe({
          next: (response) => {
            const responseData = options.schema.response.format<T>(response);
            socket.emit(options.event, responseData);
          },
          error: (error) => {
            this.handleHandlerError(socket, error, SocketioServer.METRIC.SERVER_ERROR);
            this.log.error(error);
          },
        });
    } catch (error) {
      this.handleHandlerError(socket, error, SocketioServer.METRIC.CLIENT_ERROR);
    }
  }

  protected handleHandlerError(socket: IServerSocket, error: any, metric: string): void {
    // TODO: Send error codes to socket?
    this.metric.increment(metric);
    this.debug(error);
    socket.disconnect();
  }

}
