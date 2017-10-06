import * as path from "path";
import { Container, Environment } from "../../../container";
import { Script } from "../Script";

describe("Script", () => {

  const ENVIRONMENT = new Environment()
    .set(Script.ENV.PATH, path.resolve(__dirname, "scripts"));

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Script.NAME, Script);

  const SCRIPT = CONTAINER.resolve<Script>(Script.NAME);

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

  it("#Script", () => {
    expect(SCRIPT).toBeDefined();
    expect(SCRIPT.name).toEqual(Script.NAME);
  });

});
