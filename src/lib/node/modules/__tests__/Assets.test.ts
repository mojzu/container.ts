import * as path from "path";
import { Container, Environment } from "../../../../container";
import { Assets, AssetsError, EAssetsEnv, EAssetsError } from "../Assets";

describe("Assets", () => {
  const ENVIRONMENT = new Environment().set(EAssetsEnv.Path, path.resolve(__dirname, "assets"));
  const CONTAINER = new Container("Test", ENVIRONMENT).registerModule(Assets);
  const ASSETS = CONTAINER.resolve<Assets>(Assets.moduleName);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
    CONTAINER.destroy();
  });

  it("is defined", () => {
    expect(ASSETS).toBeDefined();
    expect(ASSETS.moduleName).toEqual(Assets.moduleName);
  });

  it("reads file without encoding as buffer", async () => {
    const data = await ASSETS.readFile("test.txt", { cache: false });
    expect(data instanceof Buffer).toEqual(true);
    expect(ASSETS.isCached("test.txt")).toEqual(false);
  });

  it("reads file with encoding as string", async () => {
    const text = await ASSETS.readFile("test.txt", { cache: true, encoding: "utf8" });
    expect(typeof text === "string").toEqual(true);
    expect(ASSETS.isCached("test.txt", "utf8")).toEqual(true);
  });

  it("reads json", async () => {
    const json = await ASSETS.readJson("test.json");
    expect(typeof json === "object").toEqual(true);
    expect(ASSETS.isCached("test.json", "utf8")).toEqual(true);
  });

  it("returns parse error for invalid json", async (done) => {
    try {
      await ASSETS.readJson("invalid.json");
      done.fail();
    } catch (error) {
      expect(error instanceof AssetsError).toEqual(true);
      expect(error.name).toEqual(EAssetsError.JsonParse);
      done();
    }
  });

  it("returns read file error for invalid path", async (done) => {
    try {
      await ASSETS.readJson("doesnotexist.json");
      done.fail();
    } catch (error) {
      expect(error instanceof AssetsError).toEqual(true);
      expect(error.name).toEqual(EAssetsError.ReadFile);
      done();
    }
  });

  it("reads directory", async () => {
    const data = await ASSETS.readDirectory("");
    expect(data).toEqual(["invalid.json", "test.json", "test.txt"]);
  });
});
