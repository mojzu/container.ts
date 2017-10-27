import * as path from "path";
import { Container, Environment } from "../../../container";
import { ScriptsServer } from "../ScriptsServer";
import { TestModule } from "./Scripts.test";

describe("ScriptsServer", () => {

  const ENVIRONMENT = new Environment()
    .set(ScriptsServer.ENV.PATH, path.resolve(__dirname, "scripts"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(ScriptsServer.NAME, ScriptsServer)
    .registerModule(TestModule.NAME, TestModule);

  const SCRIPTS = CONTAINER.resolve<ScriptsServer>(ScriptsServer.NAME);

  beforeAll(async () => {
    await CONTAINER.start().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.stop().toPromise();
  });

  it("#ScriptsServer", () => {
    expect(SCRIPTS).toBeDefined();
    expect(SCRIPTS.name).toEqual(ScriptsServer.NAME);
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
