/// <reference types="jasmine" />
import { LogLevel, ILogMessage, ILogMetadata, Logger } from "./log";

type ITestLoggerCallback = (level: LogLevel, message: ILogMessage, metadata?: ILogMetadata) => void;

class TestLogger extends Logger {
  protected log(level: LogLevel, message: ILogMessage, metadata?: ILogMetadata, callback?: ITestLoggerCallback): void {
    if (callback != null) {
      callback(level, message, metadata);
    }
  }
}

describe("Log", () => {

  const LOGGER = new TestLogger();

  it("#Logger#emergency", (done) => {
    const error = new Error("Emergency");
    const metadata = { value: 1 };
    LOGGER.emergency(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Emergency);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Logger#alert", (done) => {
    const error = new Error("Alert");
    const metadata = { value: 1 };
    LOGGER.alert(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Alert);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Logger#critical", (done) => {
    const error = new Error("Critical");
    const metadata = { value: 1 };
    LOGGER.critical(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Critical);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Logger#error", (done) => {
    const error = new Error("Error");
    const metadata = { value: 1 };
    LOGGER.error(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Error);
      expect(logError).toEqual(error);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Logger#warn", (done) => {
    const message = "Warning";
    const metadata = { value: 1 };
    LOGGER.warn(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Warning);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Logger#notice", (done) => {
    const message = "Notice";
    const metadata = { value: 1 };
    LOGGER.notice(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Notice);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Logger#info", (done) => {
    const message = "Informational";
    const metadata = { value: 1 };
    LOGGER.info(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Informational);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

  it("#Logger#debug", (done) => {
    const message = "Debug";
    const metadata = { value: 1 };
    LOGGER.debug(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Debug);
      expect(logMessage).toEqual(message);
      expect(logMetadata).toBeDefined();
      expect(logMetadata.value).toEqual(metadata.value);
      done();
    });
  });

});
