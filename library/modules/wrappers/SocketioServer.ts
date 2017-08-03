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
  IMetricTags,
} from "../../container";
import {
  Validate,
  ISchemaTypes,
  ISchemaConstructor,
  buildSchema,
} from "../../lib/validate";
// TODO: Refactor when tested.

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
  timeout?: number;
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

  /** Default event handler timeout. */
  public static DEFAULT_RESPONSE_TIMEOUT = 10000;

  /** Environment variable names. */
  public static ENV = {
    /** SocketIO server port (required). */
    PORT: "SOCKETIO_PORT",
  };

  /** Metric names. */
  public static METRIC = {
    ERROR: "SocketioServerError",
    CLOSE: "SocketioServerClose",
    CONNECTION: "SocketioServerConnection",
    DISCONNECT: "SocketioServerDisconnect",
    HANDLER_ERROR: "SocketioServerHandlerError",
    HANDLER_TIME: "SocketioServerHandlerTime",
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
    this._io.on("error", this.handleServerError.bind(this));
    this._io.on("connect", this.handleConnection.bind(this));

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

  public stop(): void {
    // Do not wait for server close, causes timeout.
    this._server.close();
    this.metric.increment(SocketioServer.METRIC.CLOSE);
    this.log.info("SocketioServerStop");
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
      timeout: options.timeout,
    };

    // Register wrapped event handler.
    socket.on(options.event, this.wrapHandler.bind(this, socket, handlerOptions, handler));
  }

  protected handleServerError(error: any): void {
    const tags = this.collectTags({ error });
    this.metric.increment(SocketioServer.METRIC.ERROR, 1, tags);
    this.log.error(error, tags);
  }

  protected handleConnection(socket: IServerSocket): void {
    const tags = this.collectTags({ socket });
    this.metric.increment(SocketioServer.METRIC.CONNECTION, 1, tags);

    // Create container scope on request.
    socket.scope = this.container.createScope();

    // Add default handlers to socket.
    Object.keys(this.handlers).map((event) => {
      const handler = this.handlers[event];
      this.addHandler(socket, handler.options, handler.handler);
    });
  }

  protected handleSocketDisconnect(socket: IServerSocket): Observable<void> {
    const tags = this.collectTags({ socket });
    this.metric.increment(SocketioServer.METRIC.DISCONNECT, 1, tags);
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

      // Handler timing information.
      socket.scope.registerValue(SocketioServer.METRIC.HANDLER_TIME, Date.now());

      handler(socket, data)
        .timeout(options.timeout || SocketioServer.DEFAULT_RESPONSE_TIMEOUT)
        .subscribe({
          next: (response) => {
            try {
              // Apply schema format rules.
              const responseData = options.schema.response.format<T>(response);
              socket.emit(options.event, responseData);
            } catch (error) {
              this.handleHandlerError(socket, error);
            }
          },
          error: (error) => {
            this.handleHandlerError(socket, error);
          },
          complete: () => {
            this.handleHandlerComplete(socket);
          },
        });
    } catch (error) {
      this.handleHandlerError(socket, error);
    }
  }

  protected handleHandlerError(socket: IServerSocket, error: any): void {
    const tags = this.collectTags({ socket, error });
    this.metric.increment(SocketioServer.METRIC.HANDLER_ERROR, 1, tags);
    // TODO: Improve error handling.
    this.debug(error);
    socket.disconnect();
    this.handleHandlerComplete(socket, error);
  }

  protected handleHandlerComplete(socket: IServerSocket, error?: any): void {
    const tags = this.collectTags({ socket, error });

    // Emit handler time metric.
    const value = Date.now() - socket.scope.resolve<number>(SocketioServer.METRIC.HANDLER_TIME);
    this.metric.timing(SocketioServer.METRIC.HANDLER_TIME, value, tags);
  }

  /** Collect metric tags from variable inputs. */
  protected collectTags(inputs: {
    socket?: IServerSocket;
    error?: any;
  } = {}): IMetricTags {
    const tags: IMetricTags = {};
    if (inputs.socket != null) {
      tags.id = inputs.socket.id;
    }
    if (inputs.error != null) {
      tags.error = inputs.error.name;
    }
    return tags;
  }

}
