/// <reference types="jasmine" />
import { Container, Environment } from "../../container";
import { ASSET_PATH } from "../../examples";
import { ENV_ASSET_PATH, Asset } from "../asset/Asset";
import { Process } from "./Process";

describe("Process", () => {

  const ENVIRONMENT = new Environment()
    .set(ENV_ASSET_PATH, ASSET_PATH);

  const CONTAINER = new Container("test", ENVIRONMENT)
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
