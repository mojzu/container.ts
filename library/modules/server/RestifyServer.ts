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
}

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
    };
  }

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // Get port environment value.
    this._port = Validate.isPort(this.environment.get(ENV_RESTIFY_PORT));
    this.debug(`${ENV_RESTIFY_PORT}="${this.port}"`);

    // TODO: Handle more Restify options.
    this._server = restify.createServer();
  }

  public start(): Observable<void> {
    const listenCallback = this._server.listen.bind(this, this.port);
    const listen: () => Observable<void> = Observable.bindNodeCallback(listenCallback) as any;
    return listen()
      .do(() => {
        // Log server information.
        this.log.info("RestifyServerStart", this.information);
      });
  }

  public stop(): Observable<void> {
    const closeCallback = this._server.close.bind(this);
    const close: () => Observable<void> = Observable.bindNodeCallback(closeCallback) as any;
    return close()
      .do(() => {
        this.log.info("RestifyServerStop");
      });
  }

}
