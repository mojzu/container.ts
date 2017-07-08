/// <reference types="jasmine" />
import * as constants from "../../constants";
import { Container, Environment } from "../../container";
import { Assets } from "./assets";

describe("Assets", () => {

  const ENVIRONMENT = new Environment()
    .set(constants.ENV_ASSETS, constants.DEFAULT_ASSETS);

  const CONTAINER = new Container("test", ENVIRONMENT)
    .registerModule(constants.ASSETS, Assets);

  const ASSETS = CONTAINER.resolve<Assets>(constants.ASSETS);

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
    expect(ASSETS.name).toEqual(constants.ASSETS);
    expect(ASSETS.path).toBeDefined();
    expect(ASSETS.cache).toEqual({});
  });

});
