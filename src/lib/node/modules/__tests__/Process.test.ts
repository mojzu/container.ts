import { Container, Environment } from "../../../../container";
import { EProcessEnv, Process } from "../Process";

describe("Process", () => {
  const ENVIRONMENT = new Environment()
    .set(EProcessEnv.Name, "test-process")
    .set(EProcessEnv.Version, "1.2.3")
    .set(EProcessEnv.NodeEnv, "development");

  const CONTAINER = new Container("Test", ENVIRONMENT).registerModule(Process);

  const PROCESS = CONTAINER.resolve<Process>(Process.moduleName);

  beforeAll(async () => {
    await CONTAINER.up().toPromise();
  });

  afterAll(async () => {
    await CONTAINER.down().toPromise();
    CONTAINER.destroy();
  });

  it("#Process", () => {
    expect(PROCESS).toBeDefined();
    expect(PROCESS.moduleName).toEqual(Process.moduleName);
    expect(PROCESS.version).toEqual("1.2.3");
    expect(PROCESS.nodeEnv).toEqual("development");
  });
});
