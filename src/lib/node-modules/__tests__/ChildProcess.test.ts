import { Container, Environment } from "../../../container";
import { ChildProcess } from "../ChildProcess";
import { IProcessOptions } from "../Process";

class TestChildProcess extends ChildProcess {
  public static readonly NAME: string = "TestChildProcess";
  public get options(): IProcessOptions {
    return {
      name: "test-child-process",
      version: "1.2.3",
      nodeEnvironment: "development",
    };
  }
}

describe("ChildProcess", () => {

  const ENVIRONMENT = new Environment();

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(TestChildProcess.NAME, TestChildProcess);

  const PROCESS = CONTAINER.resolve<TestChildProcess>(TestChildProcess.NAME);

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

  it("#ChildProcess", () => {
    expect(PROCESS).toBeDefined();
    expect(PROCESS.name).toEqual(TestChildProcess.NAME);
    expect(PROCESS.version).toEqual("1.2.3");
    expect(PROCESS.nodeEnvironment).toEqual("development");
  });

});
