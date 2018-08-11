import { Container, ContainerLogMessage, ELogLevel } from "../../../container";
import { Logs } from "../logs";

type ITestLogsCallback = (log: ContainerLogMessage) => void;

class TestLogs extends Logs {
  public static readonly moduleName: string = "TestLogs";
  protected logsOnMessage(log: ContainerLogMessage): void {
    const callback: ITestLogsCallback = log.args[0];
    if (callback != null) {
      callback(log);
    }
  }
}

describe("Logs", () => {
  const NAME = "Test";
  const CONTAINER = new Container(NAME).registerModule(TestLogs);

  const LOGS = CONTAINER.resolve<TestLogs>(TestLogs.moduleName);

  beforeAll(async () => {
    await CONTAINER.up();
  });

  afterAll(async () => {
    await CONTAINER.down();
    CONTAINER.destroy();
  });

  it("module has expected properties", () => {
    expect(LOGS).toBeDefined();
    expect(LOGS.moduleName).toEqual(TestLogs.moduleName);
  });

  it("emergency level message handled by module", (done) => {
    const error = new Error("Emergency");
    const metadata = { value: 1 };
    LOGS.log.emergency(error, metadata, (log: ContainerLogMessage) => {
      expect(log.level).toEqual(ELogLevel.Emergency);
      expect(log.message).toEqual(error);
      expect(log.metadata).toBeDefined();
      expect(log.metadata.value).toEqual(metadata.value);
      expect(log.metadata.moduleNamespace).toEqual(`${NAME}.${TestLogs.moduleName}`);
      done();
    });
  });

  it("critical level message handled by module", (done) => {
    const error = new Error("Critical");
    const metadata = { value: 1 };
    LOGS.log.critical(error, metadata, (log: ContainerLogMessage) => {
      expect(log.level).toEqual(ELogLevel.Critical);
      expect(log.message).toEqual(error);
      expect(log.metadata).toBeDefined();
      expect(log.metadata.value).toEqual(metadata.value);
      expect(log.metadata.moduleNamespace).toEqual(`${NAME}.${TestLogs.moduleName}`);
      done();
    });
  });
});
