import { assign } from "lodash";
import * as net from "net";
import { IModuleOptions } from "../../container";
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
  public static readonly moduleName: string = "Scripts";

  /** Log names. */
  public static readonly LOG = assign({}, Scripts.LOG, {
    UP: "ScriptsNetUp",
    DOWN: "ScriptsNetDown",
    CONNECTION: "ScriptsNetWorkerConnection",
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

  public constructor(options: IModuleOptions) {
    super(options);

    // Log server error events.
    this.error$.subscribe((error) => this.log.error(new ScriptsError(error)));
  }

  public moduleUp(): Observable<void> {
    const up$ = super.moduleUp() || Observable.of(undefined);
    const listen$ = Observable.bindNodeCallback<void>(this.server.listen.bind(this.server))();
    return Observable.forkJoin(up$, listen$).map(() => {
      this.log.info(ScriptsNet.LOG.UP, { port: this.port });
    });
  }

  public moduleDown() {
    this.server.close();
    this.log.info(ScriptsNet.LOG.DOWN);
    return super.moduleDown();
  }

  // TODO(HIGH): Fix worker restarts when using ScriptsNet module.
  public startWorker(name: string, target: string, options: IScriptsWorkerOptions = {}): Observable<ScriptsProcess> {
    // Create socket connection to server and start worker when connected.
    return this.createConnection()
      .switchMap((sockets) => {
        options.sockets = sockets;
        return super.startWorker(name, target, options);
      });
  }

  public connectWorkers(channel: string, one: string, two: string): Observable<boolean> {
    const workerOne = this.workers[one];
    const workerTwo = this.workers[two];

    if ((workerOne != null) && (workerTwo != null)) {
      const observable = Observable.combineLatest(workerOne.next$, workerTwo.next$)
        .switchMap((processes) => {
          return Observable.forkJoin(
            Observable.of(processes),
            this.createConnection(),
          );
        })
        .switchMap(([processes, sockets]) => {
          return Observable.forkJoin(
            processes[0].sendChannel(channel, sockets.parent),
            processes[1].sendChannel(channel, sockets.child),
          );
        })
        .map(([c1, c2]) => c1 && c2)
        .takeUntil(this.close$)
        .share();

      observable.subscribe((connected) => {
        this.log.info(ScriptsNet.LOG.CONNECTION, { connected });
      });
      return observable.take(1);
    }

    return Observable.of(false);
  }

  protected createConnection(): Observable<{ parent: net.Socket, child: net.Socket }> {
    const parentSocket$ = this.connection$.take(1);
    const childSocket = net.createConnection(this.port);
    const childSocket$ = Observable.fromEvent<void>(childSocket as any, "connect").take(1);
    return Observable.forkJoin(parentSocket$, childSocket$)
      .map(([parent]) => ({ parent, child: childSocket }));
  }

}
