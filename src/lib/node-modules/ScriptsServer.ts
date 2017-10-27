import * as net from "net";
import "rxjs/add/observable/bindNodeCallback";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/map";
import "rxjs/add/operator/switchMap";
import { Observable } from "rxjs/Observable";
import { IModuleOpts, Module } from "../../container";
import {
  IScriptsWorkerOptions,
  Scripts,
  ScriptsError,
  ScriptsProcess,
} from "./Scripts";

/** Node.js scripts with server interface. */
export class ScriptsServer extends Scripts {

  /** Default module name. */
  public static readonly NAME: string = "Scripts";

  /** Error names. */
  public static readonly ERROR = Object.assign(Module.ERROR, {
    SERVER_ERROR: "ScriptsServerError",
  });

  /** Scripts server for connecting workers. */
  public readonly server: net.Server = net.createServer();

  protected readonly close$ = Observable.fromEvent<void>(this.server, "close");
  protected readonly connection$ = Observable.fromEvent<net.Socket>(this.server, "connection");
  protected readonly error$ = Observable.fromEvent<any>(this.server, "error");

  /** Get server port number. */
  public get port(): number {
    const address = this.server.address();
    return address.port;
  }

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Log server error events.
    this.error$.subscribe((error) => this.log.error(new ScriptsError(error)));
  }

  public start(): Observable<void> {
    const start$ = super.start() || Observable.of(undefined);
    const listen$ = Observable.bindNodeCallback<void>(this.server.listen.bind(this.server))();
    return Observable.forkJoin(start$, listen$).map(() => undefined);
  }

  public stop() {
    // Close server and stop scripts.
    this.server.close();
    return super.stop();
  }

  public startWorker(name: string, target: string, options: IScriptsWorkerOptions = {}): Observable<ScriptsProcess> {
    // Create socket connection to server and start worker when connected.
    const parentSocket$ = this.connection$.take(1);
    const childSocket = net.createConnection(this.port);
    const childSocket$ = Observable.fromEvent<void>(childSocket, "connect").take(1);

    return Observable.forkJoin(parentSocket$, childSocket$)
      .switchMap(([parent]) => {
        options.sockets = { parent, child: childSocket };
        return super.startWorker(name, target, options);
      });
  }

}
