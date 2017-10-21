import { Container, ContainerLogMessage, ELogLevel } from "../../../container";
import { Logs } from "../Logs";

type ITestLogsCallback = (log: ContainerLogMessage) => void;

class TestLogs extends Logs {
  public static readonly NAME: string = "TestLogs";
  protected handleLog(log: ContainerLogMessage): void {
    const callback: ITestLogsCallback = log.args[0];
    if (callback != null) {
      callback(log);
    }
  }
}

describe("Logs", () => {

  const NAME = "Test";
  const CONTAINER = new Container(NAME)
    .registerModule(TestLogs.NAME, TestLogs);

  const LOGS = CONTAINER.resolve<TestLogs>(TestLogs.NAME);

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

  it("#TestLog", () => {
    expect(LOGS).toBeDefined();
    expect(LOGS.name).toEqual(TestLogs.NAME);
  });

  it("#TestLog#emergency", (done) => {
    const error = new Error("Emergency");
    const metadata = { value: 1 };
    LOGS.log.emergency(error, metadata, (log: ContainerLogMessage) => {
      expect(log.level).toEqual(ELogLevel.Emergency);
      expect(log.message).toEqual(error);
      expect(log.metadata).toBeDefined();
      expect(log.metadata.value).toEqual(metadata.value);
      expect(log.metadata.moduleName).toEqual(`${NAME}.${TestLogs.NAME}`);
      done();
    });
  });

  it("#TestLog#critical", (done) => {
    const error = new Error("Critical");
    const metadata = { value: 1 };
    LOGS.log.critical(error, metadata, (log: ContainerLogMessage) => {
      expect(log.level).toEqual(ELogLevel.Critical);
      expect(log.message).toEqual(error);
      expect(log.metadata).toBeDefined();
      expect(log.metadata.value).toEqual(metadata.value);
      expect(log.metadata.moduleName).toEqual(`${NAME}.${TestLogs.NAME}`);
      done();
    });
  });

});
