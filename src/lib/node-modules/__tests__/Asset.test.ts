import * as path from "path";
import { Container, Environment } from "../../../container";
import { Asset } from "../Asset";

describe("Asset", () => {

  const ENVIRONMENT = new Environment()
    .set(Asset.ENV.PATH, path.resolve(__dirname, "assets"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Asset.NAME, Asset);

  const ASSET = CONTAINER.resolve<Asset>(Asset.NAME);

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
    expect(ASSET.name).toEqual(Asset.NAME);
  });

});
