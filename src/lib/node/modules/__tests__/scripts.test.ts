import * as path from "path";
import { take } from "rxjs/operators";
import { Container, Environment } from "../../../../container";
import { Process } from "../process";
import { EScriptsEnv, Scripts } from "../scripts";

const WN = "Worker";
const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms));

describe("Scripts", () => {
  const ENVIRONMENT = new Environment().set(EScriptsEnv.Path, path.resolve(__dirname, "scripts"));
  const CONTAINER = new Container("Test", ENVIRONMENT).registerModules([Process, Scripts]);
  const SCRIPTS = CONTAINER.resolve<Scripts>(Scripts.moduleName);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
    CONTAINER.destroy();
  });

  it("is defined", () => {
    expect(SCRIPTS).toBeDefined();
    expect(SCRIPTS.moduleName).toEqual(Scripts.moduleName);
  });

  it("fork runs test script", async () => {
    const proc = SCRIPTS.fork("script.test.js");
    const code = await proc.exit$.pipe(take(1)).toPromise();
    expect(code).toEqual(0);
  });

  it("worker started and stopped", async () => {
    const worker = await SCRIPTS.startWorker(WN, "worker.test.js", { restart: false })
      .pipe(take(1))
      .toPromise();
    expect(worker.process.connected).toEqual(true);
    await timeout(500); // Otherwise 'SIGTERM' exit code is returned.

    const code = await SCRIPTS.stopWorker(WN).toPromise();
    expect(code).toEqual(0);
  });

  it("worker is restarted up to limit", (done) => {
    let restarts = 0;
    SCRIPTS.startWorker(WN, "script.test.js", { restartLimit: 3 }).subscribe({
      next: (worker) => {
        restarts += 1;
      },
      error: (error) => done(error),
      complete: () => {
        expect(restarts).toEqual(4);
        done();
      }
    });
  });
});
