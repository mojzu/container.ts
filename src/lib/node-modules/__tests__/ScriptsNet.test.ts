import * as path from "path";
import { Container, Environment } from "../../../container";
import { ScriptsNet } from "../ScriptsNet";
import { TestModule } from "./Mock";

describe("ScriptsNet", () => {

  const ENVIRONMENT = new Environment()
    .set(ScriptsNet.ENV.PATH, path.resolve(__dirname, "scripts"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(ScriptsNet.NAME, ScriptsNet)
    .registerModule(TestModule.NAME, TestModule);

  const SCRIPTS = CONTAINER.resolve<ScriptsNet>(ScriptsNet.NAME);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
  });

  it("#ScriptsNet", () => {
    expect(SCRIPTS).toBeDefined();
    expect(SCRIPTS.name).toEqual(ScriptsNet.NAME);
  });

  it("#call", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const result = await worker.call<number>("Test", "testCall3", { args: [4] }).toPromise();
    expect(result).toEqual("\nHello, world!\n");

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

  it("#ChildProcess#call", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const result = await worker.call<number>("Test", "testCall2", { args: ["hello"] }).toPromise();
    expect(result).toEqual(5);

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

  it("#event", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);

    const pong$ = worker.listen("pong").take(1);
    worker.event<number>("ping", { data: 8 });
    const result = await pong$.toPromise();
    expect(result).toEqual(16);

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

  it("#connectWorkers", async () => {
    const worker1 = await SCRIPTS.startWorker("Worker1", "worker.test.js", { restart: false }).take(1).toPromise();
    const worker2 = await SCRIPTS.startWorker("Worker2", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker1.isConnected).toEqual(true);
    expect(worker2.isConnected).toEqual(true);

    const connected = await SCRIPTS.connectWorkers("link", "Worker1", "Worker2").toPromise();
    expect(connected).toEqual(true);

    const result = await worker1.call<string>("Test", "testLinkCall", { args: [2], channel: "link" }).toPromise();
    expect(result).toEqual("\nHello, world!\n");

    const code1 = await SCRIPTS.stopWorker("Worker1").toPromise();
    const code2 = await SCRIPTS.stopWorker("Worker2").toPromise();
    expect(code1).toEqual(0);
    expect(code2).toEqual(0);
  });

  it("#ScriptsProcess#ChildProcess#call data size testing", async () => {
    const worker = await SCRIPTS.startWorker("Worker", "worker.test.js", { restart: false }).take(1).toPromise();
    expect(worker.isConnected).toEqual(true);
    const size = 2048;

    for (let i = 0; i < 10; i++) {
      // console.time("socket");
      const data = await worker.call<any[]>("Test", "testData", { args: [size] }).toPromise();
      expect(data.length).toEqual(size);
      // console.timeEnd("socket");
    }

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

});
