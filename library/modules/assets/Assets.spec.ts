/// <reference types="jasmine" />
import { Container, Environment } from "../../container";
import { ENV_ASSETS_PATH, Assets } from "./Assets";

describe("Assets", () => {

  // TODO: Fix path, examples?
  const ENVIRONMENT = new Environment()
    .set(ENV_ASSETS_PATH, "");

  const CONTAINER = new Container("test", ENVIRONMENT)
    .registerModule(Assets);

  const ASSETS = CONTAINER.resolve<Assets>(Assets.name);

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

  it("#Assets", () => {
    expect(ASSETS).toBeDefined();
    expect(ASSETS.name).toEqual(Assets.name);
    expect(ASSETS.path).toBeDefined();
    expect(ASSETS.cache).toEqual({});
  });

});
