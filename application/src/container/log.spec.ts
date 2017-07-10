/// <reference types="jasmine" />
import { LogLevel, ILogMessage, ILogMetadata, Log } from "./log";

type ITestLogCallback = (level: LogLevel, message: ILogMessage, metadata?: ILogMetadata) => void;

class TestLog extends Log {
  protected log(level: LogLevel, message: ILogMessage, metadata?: ILogMetadata, callback?: ITestLogCallback): void {
    if (callback != null) {
      callback(level, message, metadata);
    }
  }
}

describe("Log", () => {

  const LOG = new TestLog();

  it("#Log#emergency", (done) => {
    const error = new Error("Emergency");
    const metadata = { value: 1 };
    LOG.emergency(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Emergency);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Log#alert", (done) => {
    const error = new Error("Alert");
    const metadata = { value: 1 };
    LOG.alert(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Alert);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Log#critical", (done) => {
    const error = new Error("Critical");
    const metadata = { value: 1 };
    LOG.critical(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Critical);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Log#error", (done) => {
    const error = new Error("Error");
    const metadata = { value: 1 };
    LOG.error(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Error);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Log#warn", (done) => {
    const message = "Warning";
    const metadata = { value: 1 };
    LOG.warn(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Warning);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Log#notice", (done) => {
    const message = "Notice";
    const metadata = { value: 1 };
    LOG.notice(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Notice);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Log#info", (done) => {
    const message = "Informational";
    const metadata = { value: 1 };
    LOG.info(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Informational);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Log#debug", (done) => {
    const message = "Debug";
    const metadata = { value: 1 };
    LOG.debug(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Debug);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

});
