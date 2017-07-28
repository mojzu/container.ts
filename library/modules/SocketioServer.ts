/// <reference types="node" />
import * as http from "http";
import * as socketio from "socket.io";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/bindNodeCallback";
import "rxjs/add/operator/do";
import { IContainerModuleOpts, ContainerModule } from "../container";
import { Validate } from "../lib/validate";

/** SocketIO server information interface. */
export interface ISocketioServerInformation {
  url: string;
  origins: string;
}

export class SocketioServer extends ContainerModule {

  /** Environment variable names. */
  public static ENV = {
    /** SocketIO server port (required). */
    PORT: "SOCKETIO_PORT",
  };

  private _port: number;
  private _server: http.Server;
  private _io: SocketIO.Server;

  public get port(): number { return this._port; }
  public get server(): http.Server { return this._server; }
  public get io(): SocketIO.Server { return this._io; }

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

    // TODO: Handle more SocketIO options.
    this._server = http.createServer();
    this._io = socketio(this.server);

    // Register event handlers.
    this._server.on("error", this.handleServerError.bind(this));
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

  protected handleServerError(error: any): void {
    this.log.error(error);
  }

}
