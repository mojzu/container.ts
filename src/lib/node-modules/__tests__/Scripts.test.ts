import * as path from "path";
import { Container, Environment } from "../../../container";
import { Scripts } from "../Scripts";

describe("Scripts", () => {

  const ENVIRONMENT = new Environment()
    .set(Scripts.ENV.PATH, path.resolve(__dirname, "scripts"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Scripts.NAME, Scripts);

  const SCRIPTS = CONTAINER.resolve<Scripts>(Scripts.NAME);
  const WORKER = "Worker";

  beforeAll(async () => {
    await CONTAINER.start().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.stop().toPromise();
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
    const worker = SCRIPTS.startWorker(WORKER, "worker.test.js", { restart: false });
    expect(worker.connected).toEqual(true);

    const code = await SCRIPTS.stopWorker(WORKER).toPromise();
    expect(code).toEqual("SIGTERM");
  });

  it("#ScriptsProcess#call", async () => {
    const worker = SCRIPTS.startWorker(WORKER, "worker.test.js", { restart: false });
    expect(worker.connected).toEqual(true);

    const result = await worker.call("Test", "testCall", { args: [4] }).toPromise();
    expect(result).toEqual(8);

    const code = await SCRIPTS.stopWorker(WORKER).toPromise();
    expect(code).toEqual(0);
  });

  it("#ScriptsProcess#event", async () => {
    const worker = SCRIPTS.startWorker(WORKER, "worker.test.js", { restart: false });
    expect(worker.connected).toEqual(true);

    const pong$ = worker.listen("pong").take(1);
    worker.event<number>("ping", 8);
    const result = await pong$.toPromise();
    expect(result).toEqual(16);

    const code = await SCRIPTS.stopWorker(WORKER).toPromise();
    expect(code).toEqual(0);
  });

});
