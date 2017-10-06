import { Container, ContainerLogMessage, ELogLevel } from "../../../container";
import { Log } from "../Log";

type ITestLogCallback = (log: ContainerLogMessage) => void;

class TestLog extends Log {
  public static readonly NAME: string = "TestLog";
  protected handleLog(log: ContainerLogMessage): void {
    const callback: ITestLogCallback = log.args[0];
    if (callback != null) {
      callback(log);
    }
  }
}

describe("Log", () => {

  const NAME = "Test";
  const CONTAINER = new Container(NAME)
    .registerModule(TestLog.NAME, TestLog);

  const LOG = CONTAINER.resolve<TestLog>(TestLog.NAME);

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
    expect(LOG).toBeDefined();
    expect(LOG.name).toEqual(TestLog.NAME);
  });

  it("#TestLog#emergency", (done) => {
    const error = new Error("Emergency");
    const metadata = { value: 1 };
    LOG.log.emergency(error, metadata, (log: ContainerLogMessage) => {
      expect(log.level).toEqual(ELogLevel.Emergency);
      expect(log.message).toEqual(error);
      expect(log.metadata).toBeDefined();
      expect(log.metadata.value).toEqual(metadata.value);
      expect(log.metadata.moduleName).toEqual(`${NAME}.${TestLog.NAME}`);
      done();
    });
  });

  it("#TestLog#critical", (done) => {
    const error = new Error("Critical");
    const metadata = { value: 1 };
    LOG.log.critical(error, metadata, (log: ContainerLogMessage) => {
      expect(log.level).toEqual(ELogLevel.Critical);
      expect(log.message).toEqual(error);
      expect(log.metadata).toBeDefined();
      expect(log.metadata.value).toEqual(metadata.value);
      expect(log.metadata.moduleName).toEqual(`${NAME}.${TestLog.NAME}`);
      done();
    });
  });

});
