/// <reference types="jasmine" />
import { Container, Environment } from "../../container";
import { ASSETS_PATH } from "../../examples";
import { ENV_ASSETS_PATH, Assets } from "../assets/Assets";
import { Process } from "./Process";

describe("Process", () => {

  const ENVIRONMENT = new Environment()
    .set(ENV_ASSETS_PATH, ASSETS_PATH);

  const CONTAINER = new Container("test", ENVIRONMENT)
    .registerModule(Assets)
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
