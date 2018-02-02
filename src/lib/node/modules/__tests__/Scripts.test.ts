import * as path from "path";
import { Container, Environment, Module } from "../../../../container";
import { ErrorChain } from "../../../error";
import { Process } from "../Process";
import { Observable } from "../RxJS";
import { Scripts } from "../Scripts";

const WN = "Worker";
const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms));

class TestModule extends Module {
  public static readonly moduleName: string = "Test";
  // Test method called from child process.
  public testCall2(data: string): Observable<number> {
    return Observable.of(data.length);
  }
  public testCall5(data: number): Observable<number> {
    return Observable.of(data);
  }
}

describe("Scripts", () => {
  const ENVIRONMENT = new Environment()
    .set(Scripts.ENV.PATH, path.resolve(__dirname, "scripts"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModules([Process, Scripts, TestModule]);

  const SCRIPTS = CONTAINER.resolve<Scripts>(Scripts.moduleName);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
    CONTAINER.destroy();
  });

  it("#Scripts", () => {
    expect(SCRIPTS).toBeDefined();
    expect(SCRIPTS.moduleName).toEqual(Scripts.moduleName);
  });

  it("#fork", async () => {
    const proc = SCRIPTS.fork("script.test.js");
    const code = await proc.exit$.take(1).toPromise();
    expect(code).toEqual(0);
  });

  it("#startWorker", async () => {
    const worker = await SCRIPTS.startWorker(WN, "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);
    await timeout(500); // Otherwise 'SIGTERM' exit code is returned.

    const code = await SCRIPTS.stopWorker(WN).toPromise();
    expect(code).toEqual(0);
  });

  it("#startWorker#restartLimit", (done) => {
    let restarts = 0;
    SCRIPTS.startWorker(WN, "script.test.js", { disableIpc: true, restartLimit: 3 })
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

  it("#startWorker ipc timeout", async (done) => {
    try {
      await SCRIPTS.startWorker(WN, "script.test.js", { restart: false }).take(1).toPromise();
      done.fail();
    } catch (error) {
      expect(error instanceof ErrorChain).toEqual(true);
      expect(error.joinNames()).toEqual("ScriptsError.TimeoutError");
      done();
    }
  });

  it("#ScriptsProcess#call function does not exist", async (done) => {
    const worker = await SCRIPTS.startWorker(WN, "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    try {
      await worker.call("Test", "doesNotExist").toPromise();
      done.fail();
    } catch (error) {
      expect(error instanceof ErrorChain).toEqual(true);
      expect(error.joinNames()).toEqual("ProcessError.TypeError");
    }

    const code = await SCRIPTS.stopWorker(WN).toPromise();
    expect(code).toEqual(0);
    done();
  });

  it("#ScriptsProcess#call", async () => {
    const worker = await SCRIPTS.startWorker(WN, "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const result = await worker.call<number>("Test", "testCall1", { args: [4] }).toPromise();
    expect(result).toEqual(8);

    const code = await SCRIPTS.stopWorker(WN).toPromise();
    expect(code).toEqual(0);
  });

  it("#ScriptsProcess#call multiple workers", async () => {
    const worker1 = await SCRIPTS.startWorker(`${WN}1`, "worker.test.js").take(1).toPromise();
    expect(worker1.isConnected).toEqual(true);
    const worker2 = await SCRIPTS.startWorker(`${WN}2`, "worker.test.js").take(1).toPromise();
    expect(worker2.isConnected).toEqual(true);

    const result1 = await worker1.call<number>("Test", "testCall4", { args: [1] }).toPromise();
    expect(result1).toEqual(1);
    const result2 = await worker2.call<number>("Test", "testCall4", { args: [2] }).toPromise();
    expect(result2).toEqual(2);

    const code1 = await SCRIPTS.stopWorker(`${WN}1`).toPromise();
    expect(code1).toEqual(0);
    const code2 = await SCRIPTS.stopWorker(`${WN}2`).toPromise();
    expect(code2).toEqual(0);
  });

  it("#ScriptsProcess#ChildProcess#call", async () => {
    const worker = await SCRIPTS.startWorker(WN, "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const result = await worker.call<number>("Test", "testCall2", { args: ["hello"] }).toPromise();
    expect(result).toEqual(5);

    const code = await SCRIPTS.stopWorker(WN).toPromise();
    expect(code).toEqual(0);
  });

  it("#ScriptsProcess#ChildProcess#call multiple workers", async () => {
    const worker1 = await SCRIPTS.startWorker(`${WN}1`, "worker.test.js").take(1).toPromise();
    expect(worker1.isConnected).toEqual(true);
    const worker2 = await SCRIPTS.startWorker(`${WN}2`, "worker.test.js").take(1).toPromise();
    expect(worker2.isConnected).toEqual(true);

    const result1 = await worker1.call<number>("Test", "testCall5", { args: [100] }).toPromise();
    expect(result1).toEqual(100);
    const result2 = await worker2.call<number>("Test", "testCall5", { args: [200] }).toPromise();
    expect(result2).toEqual(200);

    const code1 = await SCRIPTS.stopWorker(`${WN}1`).toPromise();
    expect(code1).toEqual(0);
    const code2 = await SCRIPTS.stopWorker(`${WN}2`).toPromise();
    expect(code2).toEqual(0);
  });

  it("#call", async () => {
    const worker = await SCRIPTS.startWorker(WN, "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const result = await worker.call<number>("Test", "testCall3", { args: [4] }).toPromise();
    expect(result).toEqual("\nHello, world!\n");

    const code = await SCRIPTS.stopWorker(WN).toPromise();
    expect(code).toEqual(0);
  });

  it("#ScriptsProcess#event", async () => {
    const worker = await SCRIPTS.startWorker(WN, "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const pong$ = worker.listen("pong").take(1);
    worker.event<number>("ping", { data: 8 });
    const result = await pong$.toPromise();
    expect(result).toEqual(16);

    const code = await SCRIPTS.stopWorker(WN).toPromise();
    expect(code).toEqual(0);
  });

  it("#ScriptsProcess#ChildProcess#call data size testing", async () => {
    const worker = await SCRIPTS.startWorker(WN, "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);
    const size = 1024;

    for (let i = 0; i < 10; i++) {
      // console.time("process");
      const data = await worker.call<any[]>("Test", "testData", { args: [size] }).toPromise();
      expect(data.length).toEqual(size);
      // console.timeEnd("process");
    }

    const code = await SCRIPTS.stopWorker(WN).toPromise();
    expect(code).toEqual(0);
  });
});
