/// <reference types="jasmine" />
import { Container, Environment } from "../container";
import { ASSET_PATH } from "../examples";
import { Asset } from "./Asset";

describe("Asset", () => {

  const ENVIRONMENT = new Environment()
    .set(Asset.ENV.PATH, ASSET_PATH);

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Asset);

  const ASSET = CONTAINER.resolve<Asset>(Asset.name);

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

  it("#Asset", () => {
    expect(ASSET).toBeDefined();
    expect(ASSET.name).toEqual(Asset.name);
    expect(ASSET.path).toBeDefined();
    expect(ASSET.cache).toEqual({});
  });

});
