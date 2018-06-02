import { ELogLevel, ILogMessage, ILogMetadata, Log } from "../log";

type ITestLogCallback = (level: ELogLevel, message: ILogMessage, metadata: ILogMetadata) => void;

class TestLog extends Log {
  protected log(level: ELogLevel, message: ILogMessage, metadata: ILogMetadata, callback?: ITestLogCallback): void {
    if (callback != null) {
      callback(level, message, metadata);
    }
  }
}

describe("Log", () => {
  const LOG = new TestLog();

  it("emergency level message", (done) => {
    const error = new Error("Emergency");
    const metadata = { value: 1 };
    LOG.emergency(error, metadata, (level: ELogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(ELogLevel.Emergency);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("alert level message", (done) => {
    const error = new Error("Alert");
    const metadata = { value: 1 };
    LOG.alert(error, metadata, (level: ELogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(ELogLevel.Alert);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("critical level message", (done) => {
    const error = new Error("Critical");
    const metadata = { value: 1 };
    LOG.critical(error, metadata, (level: ELogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(ELogLevel.Critical);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("error level message", (done) => {
    const error = new Error("Error");
    const metadata = { value: 1 };
    LOG.error(error, metadata, (level: ELogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(ELogLevel.Error);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("warn level message", (done) => {
    const message = "Warning";
    const metadata = { value: 1 };
    LOG.warn(message, metadata, (level: ELogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(ELogLevel.Warning);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("notice level message", (done) => {
    const message = "Notice";
    const metadata = { value: 1 };
    LOG.notice(message, metadata, (level: ELogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(ELogLevel.Notice);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("info level message", (done) => {
    const message = "Informational";
    const metadata = { value: 1 };
    LOG.info(message, metadata, (level: ELogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(ELogLevel.Informational);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("debug level message", (done) => {
    const message = "Debug";
    const metadata = { value: 1 };
    LOG.debug(message, metadata, (level: ELogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(ELogLevel.Debug);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });
});
