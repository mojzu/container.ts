import { Container, Environment } from "../../../container";
import { IProcessOptions, Process } from "../Process";

class TestProcess extends Process {
  public static readonly NAME: string = "TestProcess";
  public get options(): IProcessOptions {
    return {
      name: "test-process",
      version: "1.2.3",
      nodeEnvironment: "development",
    };
  }
}

describe("Process", () => {

  const ENVIRONMENT = new Environment();

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(TestProcess.NAME, TestProcess);

  const PROCESS = CONTAINER.resolve<TestProcess>(TestProcess.NAME);

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

  it("#Process", () => {
    expect(PROCESS).toBeDefined();
    expect(PROCESS.name).toEqual(TestProcess.NAME);
    expect(PROCESS.version).toEqual("1.2.3");
    expect(PROCESS.nodeEnvironment).toEqual("development");
  });

});
