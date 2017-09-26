/// <reference types="jasmine" />
import { Container, Environment } from "../container";
import { IProcessOptions, Process } from "./Process";

class TestProcess extends Process {
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
    .registerModule(TestProcess);

  const PROCESS = CONTAINER.resolve<TestProcess>(TestProcess.name);

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
    expect(PROCESS.name).toEqual(TestProcess.name);
    expect(PROCESS.version).toEqual("1.2.3");
    expect(PROCESS.nodeEnvironment).toEqual("development");
  });

});
