import { Container, Environment } from "../../../container";
import { ChildProcess } from "../ChildProcess";

describe("ChildProcess", () => {

  const ENVIRONMENT = new Environment()
    .set(ChildProcess.ENV.NAME, "test-child-process")
    .set(ChildProcess.ENV.VERSION, "1.2.3")
    .set(ChildProcess.ENV.NODE_ENV, "development");

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(ChildProcess.NAME, ChildProcess);

  const PROCESS = CONTAINER.resolve<ChildProcess>(ChildProcess.NAME);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
  });

  it("#ChildProcess", () => {
    expect(PROCESS).toBeDefined();
    expect(PROCESS.name).toEqual(ChildProcess.NAME);
    expect(PROCESS.version).toEqual("1.2.3");
    expect(PROCESS.nodeEnvironment).toEqual("development");
  });

});
