import * as path from "path";
import { Container, Environment, Module } from "../../../container";
import { Observable } from "../../../container/RxJS";
import { ErrorChain } from "../../../lib/error";
import { Scripts } from "../Scripts";

export class TestModule extends Module {
  public static readonly NAME = "Test";
  // Test method called from child process.
  public testCall2(data: string): Observable<number> {
    return Observable.of(data.length);
  }
}

describe("Scripts", () => {

  const ENVIRONMENT = new Environment()
    .set(Scripts.ENV.PATH, path.resolve(__dirname, "scripts"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Scripts.NAME, Scripts)
    .registerModule(TestModule.NAME, TestModule);

  const SCRIPTS = CONTAINER.resolve<Scripts>(Scripts.NAME);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
  });

  it("#Scripts", () => {
    expect(SCRIPTS).toBeDefined();
    expect(SCRIPTS.name).toEqual(Scripts.NAME);
  });

  it("#fork", async () => {
    const proc = SCRIPTS.fork("script.test.js");
    const code = await proc.exit$.take(1).toPromise();
    expect(code).toEqual(0);
  });

  it("#startWorker", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual("SIGTERM");
  });

  it("#startWorker#restartLimit", (done) => {
    let restarts = 0;
    SCRIPTS.startWorker("Worker", "script.test.js", { restartLimit: 3 })
      .subscribe({
        next: (worker) => {
          restarts += 1;
        },
        error: (error) => done(error),
        complete: () => {
          expect(restarts).toEqual(4);
          done();
        },
      });
  });

  it("#ScriptsProcess#call function does not exist", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    try {
      await worker.call("Test", "doesNotExist").toPromise();
      fail();
    } catch (error) {
      expect(error instanceof ErrorChain).toEqual(true);
      expect(error.joinNames()).toEqual("ProcessError.TypeError");
    }

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

  it("#ScriptsProcess#call", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const result = await worker.call<number>("Test", "testCall1", { args: [4] }).toPromise();
    expect(result).toEqual(8);

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

  it("#ScriptsProcess#ChildProcess#call", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const result = await worker.call<number>("Test", "testCall2", { args: ["hello"] }).toPromise();
    expect(result).toEqual(5);

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

  it("#ScriptsProcess#event", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const pong$ = worker.listen("pong").take(1);
    worker.event<number>("ping", 8);
    const result = await pong$.toPromise();
    expect(result).toEqual(16);

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

});
