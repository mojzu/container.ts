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

  const logger = new TestLogger();

  it("#Logger#emergency", () => {
    const error = new Error("Emergency");
    const metadata = { value: 1 };
    logger.emergency(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Emergency);
      expect(logError).toEqual(error);
      expect(metadata).toBeDefined();
      expect(metadata.value).toEqual(logMetadata.value);
    });
  });

  it("#Logger#alert", () => {
    const error = new Error("Alert");
    const metadata = { value: 1 };
    logger.alert(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Alert);
      expect(logError).toEqual(error);
      expect(metadata).toBeDefined();
      expect(metadata.value).toEqual(logMetadata.value);
    });
  });

  it("#Logger#critical", () => {
    const error = new Error("Critical");
    const metadata = { value: 1 };
    logger.critical(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Critical);
      expect(logError).toEqual(error);
      expect(metadata).toBeDefined();
      expect(metadata.value).toEqual(logMetadata.value);
    });
  });

  it("#Logger#error", () => {
    const error = new Error("Error");
    const metadata = { value: 1 };
    logger.error(error, metadata, (level: LogLevel, logError: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Error);
      expect(logError).toEqual(error);
      expect(metadata).toBeDefined();
      expect(metadata.value).toEqual(logMetadata.value);
    });
  });

  it("#Logger#warn", () => {
    const message = "Warning";
    const metadata = { value: 1 };
    logger.warn(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Warning);
      expect(logMessage).toEqual(message);
      expect(metadata).toBeDefined();
      expect(metadata.value).toEqual(logMetadata.value);
    });
  });

  it("#Logger#notice", () => {
    const message = "Notice";
    const metadata = { value: 1 };
    logger.notice(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Notice);
      expect(logMessage).toEqual(message);
      expect(metadata).toBeDefined();
      expect(metadata.value).toEqual(logMetadata.value);
    });
  });

  it("#Logger#info", () => {
    const message = "Informational";
    const metadata = { value: 1 };
    logger.info(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Informational);
      expect(logMessage).toEqual(message);
      expect(metadata).toBeDefined();
      expect(metadata.value).toEqual(logMetadata.value);
    });
  });

  it("#Logger#debug", () => {
    const message = "Debug";
    const metadata = { value: 1 };
    logger.debug(message, metadata, (level: LogLevel, logMessage: ILogMessage, logMetadata: ILogMetadata) => {
      expect(level).toEqual(LogLevel.Debug);
      expect(logMessage).toEqual(message);
      expect(metadata).toBeDefined();
      expect(metadata.value).toEqual(logMetadata.value);
    });
  });

});
