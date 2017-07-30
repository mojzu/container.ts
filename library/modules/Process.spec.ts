/// <reference types="jasmine" />
import { Container, Environment } from "../container";
import { ASSET_PATH } from "../examples";
import { Asset } from "./Asset";
import { Process } from "./Process";

describe("Process", () => {

  const ENVIRONMENT = new Environment()
    .set(Asset.ENV.PATH, ASSET_PATH);

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Asset)
    .registerModule(Process);

  const PROCESS = CONTAINER.resolve<Process>(Process.name);

  beforeAll((done) => {
    CONTAINER.start()
      .subscribe({
        next: () => done(),
        error: (error) => done.fail(error),
      });
  });

  afterAll((done) => {
    CONTAINER.stop()
      .subscribe({
        next: () => done(),
        error: (error) => done.fail(error),
      });
  });

  it("#Process", () => {
    expect(PROCESS).toBeDefined();
    expect(PROCESS.name).toEqual(Process.name);
  });

});
