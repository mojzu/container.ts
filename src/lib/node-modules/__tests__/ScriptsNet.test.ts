import * as path from "path";
import { Container, Environment } from "../../../container";
import { ScriptsNet } from "../ScriptsNet";
import { TestModule } from "./Scripts.test";

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
    worker.event<number>("ping", 8);
    const result = await pong$.toPromise();
    expect(result).toEqual(16);

    const code = await SCRIPTS.stopWorker("Worker").toPromise();
    expect(code).toEqual(0);
  });

});
