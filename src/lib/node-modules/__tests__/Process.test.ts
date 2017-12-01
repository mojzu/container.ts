import { Container, Environment } from "../../../container";
import { Process } from "../Process";

describe("Process", () => {

  const ENVIRONMENT = new Environment()
    .set(Process.ENV.NAME, "test-process")
    .set(Process.ENV.VERSION, "1.2.3")
    .set(Process.ENV.NODE_ENV, "development");

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(Process);

  const PROCESS = CONTAINER.resolve<Process>(Process.NAME);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
  });

  it("#Process", () => {
    expect(PROCESS).toBeDefined();
    expect(PROCESS.name).toEqual(Process.NAME);
    expect(PROCESS.version).toEqual("1.2.3");
    expect(PROCESS.nodeEnvironment).toEqual("development");
  });

});
