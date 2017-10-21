import * as path from "path";
import { Container, Environment } from "../../../container";
import { Scripts } from "../Scripts";

describe("Scripts", () => {

  const ENVIRONMENT = new Environment()
    .set(Scripts.ENV.PATH, path.resolve(__dirname, "scripts"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Scripts.NAME, Scripts);

  const SCRIPTS = CONTAINER.resolve<Scripts>(Scripts.NAME);

  beforeAll(async () => {
    await CONTAINER.start().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.stop().toPromise();
  });

  it("#Scripts", () => {
    expect(SCRIPTS).toBeDefined();
    expect(SCRIPTS.name).toEqual(Scripts.NAME);
  });

});
