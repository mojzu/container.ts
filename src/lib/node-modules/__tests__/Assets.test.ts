import * as path from "path";
import { Container, Environment } from "../../../container";
import { Assets, AssetsError } from "../Assets";

describe("Assets", () => {

  const ENVIRONMENT = new Environment()
    .set(Assets.ENV.PATH, path.resolve(__dirname, "assets"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Assets);

  const ASSETS = CONTAINER.resolve<Assets>(Assets.moduleName);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
    CONTAINER.destroy();
  });

  it("#Assets", () => {
    expect(ASSETS).toBeDefined();
    expect(ASSETS.moduleName).toEqual(Assets.moduleName);
  });

  it("#readFile without encoding", async () => {
    const data = await ASSETS.readFile("test.txt", { cache: false });
    expect(data instanceof Buffer).toEqual(true);
    expect(ASSETS.isCached("test.txt")).toEqual(false);
  });

  it("#readFile with encoding", async () => {
    const text = await ASSETS.readFile("test.txt", { cache: true, encoding: "utf8" });
    expect(typeof text === "string").toEqual(true);
    expect(ASSETS.isCached("test.txt", "utf8")).toEqual(true);
  });

  it("#readJson", async () => {
    const json = await ASSETS.readJson("test.json");
    expect(typeof json === "object").toEqual(true);
    expect(ASSETS.isCached("test.json", "utf8")).toEqual(true);
  });

  it("#readJson parse error", async () => {
    try {
      await ASSETS.readJson("invalid.json");
      fail();
    } catch (error) {
      expect(error instanceof AssetsError).toEqual(true);
      expect(error.name).toEqual(Assets.ERROR.JSON_PARSE);
    }
  });

  it("#readJson does not exist", async () => {
    try {
      await ASSETS.readJson("doesnotexist.json");
      fail();
    } catch (error) {
      expect(error instanceof AssetsError).toEqual(true);
      expect(error.name).toEqual(Assets.ERROR.READ_FILE);
    }
  });

});
