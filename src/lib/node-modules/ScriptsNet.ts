import * as net from "net";
import { IModuleOpts } from "../../container";
import { Observable } from "../../container/RxJS";
import {
  IScriptsWorkerOptions,
  Scripts,
  ScriptsError,
  ScriptsProcess,
} from "./Scripts";

/** Node.js scripts with server interface. */
export class ScriptsNet extends Scripts {

  /** Default module name. */
  public static readonly NAME: string = "Scripts";

  /** Log names. */
  public static readonly LOG = Object.assign(Scripts.LOG, {
    UP: "ScriptsNetUp",
    DOWN: "ScriptsNetDown",
  });

  /** Scripts server for connecting workers. */
  public readonly server: net.Server = net.createServer();

  protected readonly close$ = Observable.fromEvent<void>(this.server as any, "close");
  protected readonly connection$ = Observable.fromEvent<net.Socket>(this.server as any, "connection");
  protected readonly error$ = Observable.fromEvent<any>(this.server as any, "error");

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

  public up(): Observable<void> {
    const up$ = super.up() || Observable.of(undefined);
    const listen$ = Observable.bindNodeCallback<void>(this.server.listen.bind(this.server))();
    return Observable.forkJoin(up$, listen$).map(() => {
      this.log.info(ScriptsNet.LOG.UP, { port: this.port });
    });
  }

  public down() {
    this.server.close();
    this.log.info(ScriptsNet.LOG.DOWN);
    return super.down();
  }

  public startWorker(name: string, target: string, options: IScriptsWorkerOptions = {}): Observable<ScriptsProcess> {
    // Create socket connection to server and start worker when connected.
    const parentSocket$ = this.connection$.take(1);
    const childSocket = net.createConnection(this.port);
    const childSocket$ = Observable.fromEvent<void>(childSocket as any, "connect").take(1);

    return Observable.forkJoin(parentSocket$, childSocket$)
      .switchMap(([parent]) => {
        options.sockets = { parent, child: childSocket };
        return super.startWorker(name, target, options);
      });
  }

}
