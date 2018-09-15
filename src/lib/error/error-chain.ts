import { isPlainObject } from "lodash";

/** Error chain data type. */
export interface IErrorChain {
  name: string;
  value?: any;
}

/** Serialised error chain item type. */
export interface IErrorChainItem extends IErrorChain {
  stack: string;
  message?: string;
  errno?: number;
  code?: string;
  path?: string;
  syscall?: string;
}

/** Serialised error chain items. */
export interface IErrorChainSerialised {
  ErrorChain: IErrorChainItem[];
}

/** Error chain error names. */
export enum EErrorChainError {
  Serialise = "ErrorChainError.Serialise",
  Deserialise = "ErrorChainError.Deserialise"
}

/**
 * ErrorChain class.
 * Serialisable, chained errors utility.
 */
export class ErrorChain {
  /** Returns true if error instance of ErrorChain. */
  public static isErrorChain(error: any): error is ErrorChain {
    const instanceOf = error instanceof ErrorChain;
    const hasProperty = !!error.isErrorChain;
    return instanceOf || hasProperty;
  }

  /** Returns true if error instance of Error or ErrorChain */
  public static isError(error: any): error is Error | ErrorChain {
    return error instanceof Error || ErrorChain.isErrorChain(error);
  }

  /** Returns name representation of error argument. */
  public static errorName(error: any): string {
    if (ErrorChain.isErrorChain(error)) {
      return error.joinNames();
    } else if (ErrorChain.isError(error) && error.name != null) {
      return error.name;
    }
    return String(error);
  }

  /**
   * Construct error message from name, data and optional cause.
   * If data is a plain object it will be serialised into a JSON string.
   */
  public static messageConstructor(data: IErrorChain, cause?: ErrorChain | Error): string {
    let message = data.name;
    if (data.value != null) {
      if (isPlainObject(data.value)) {
        message += ` "${JSON.stringify(data.value)}"`;
      } else {
        message += ` "${data.value}"`;
      }
    }
    if (cause != null) {
      message += `: ${cause}`;
    }
    return message;
  }

  /** Return serialisable object of generic error data. */
  public static serialiseError(error: any): IErrorChainItem {
    const serialised: IErrorChainItem = {
      name: String(error.name || ""),
      stack: String(error.stack || ""),
      message: String(error.stack || "")
    };
    if (error.errno != null) {
      serialised.errno = Number(error.errno);
    }
    if (error.code != null) {
      serialised.code = String(error.code);
    }
    if (error.path != null) {
      serialised.path = String(error.path);
    }
    if (error.syscall != null) {
      serialised.syscall = String(error.syscall);
    }
    return serialised;
  }

  /** Return deserialised ErrorChain instance of serialised data. */
  public static deserialise(serialised: IErrorChainSerialised): ErrorChain | undefined {
    try {
      let chained: ErrorChain | undefined;

      serialised.ErrorChain.reduceRight((p, current) => {
        chained = new ErrorChain(current, chained || undefined);
        chained = Object.assign(chained, current);
        return null;
      }, null);

      return chained;
    } catch (error) {
      throw new ErrorChain({ name: EErrorChainError.Deserialise, value: serialised }, error);
    }
  }

  public readonly name: string;
  public readonly stack?: string;
  public readonly message?: string;
  public readonly value?: any;
  public readonly cause?: ErrorChain | Error;

  /** Used for isErrorChain static method. */
  protected readonly isErrorChain = true;

  public constructor(data: IErrorChain, cause?: ErrorChain | Error) {
    const error = new Error(ErrorChain.messageConstructor(data, cause));
    this.name = error.name = data.name;
    this.stack = error.stack;
    this.message = error.message;
    this.value = data.value;
    this.cause = cause;
  }

  // TODO(L): Pretty print function for readability.
  public toString(): string {
    return this.message || "";
  }

  /** Join chained error names with a separator. */
  public joinNames(separator = "."): string {
    const names = [this.name];

    if (this.cause != null) {
      if (ErrorChain.isErrorChain(this.cause)) {
        names.push(this.cause.joinNames(separator));
      } else if (ErrorChain.isError(this.cause)) {
        if (this.cause.name != null) {
          names.push(this.cause.name);
        }
      }
    }

    return names.join(separator);
  }

  /** Return serialised data for this chained error. */
  public serialise(): IErrorChainSerialised {
    try {
      let chained: IErrorChainItem[] = [
        {
          name: this.name,
          stack: String(this.stack || ""),
          message: this.message
        }
      ];
      if (this.value != null) {
        chained[0].value = this.value;
      }

      // Serialise chained error if available.
      if (this.cause != null) {
        if (ErrorChain.isErrorChain(this.cause)) {
          const serialised = this.cause.serialise();
          chained = chained.concat(serialised.ErrorChain);
        } else if (ErrorChain.isError(this.cause)) {
          chained.push(ErrorChain.serialiseError(this.cause));
        } else if (isPlainObject(this.cause)) {
          chained.push(this.cause);
        }
      }

      return { ErrorChain: chained };
    } catch (error) {
      throw new ErrorChain({ name: EErrorChainError.Serialise }, error);
    }
  }
}
