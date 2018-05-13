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
    return error instanceof ErrorChain;
  }

  /** Returns true if error instance of Error or ErrorChain */
  public static isError(error: any): error is Error | ErrorChain {
    return error instanceof Error || error instanceof ErrorChain;
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

  /** Construct error message from data and optional cause. */
  public static messageConstructor(data: IErrorChain, cause?: ErrorChain | Error): string {
    let message = data.name;
    if (data.value != null) {
      message += ` "${data.value}"`;
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
    // Remove duplicate stack/message properties.
    if (serialised.stack === serialised.message) {
      delete serialised.message;
    }
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

  public constructor(data: IErrorChain, cause?: ErrorChain | Error) {
    const error = new Error(ErrorChain.messageConstructor(data, cause));
    this.name = error.name = data.name;
    this.stack = error.stack;
    this.message = error.message;
    this.value = data.value;
    this.cause = cause;
  }

  public toString(): string {
    return this.message || "";
  }

  /** Join chained error names. */
  public joinNames(separator = "."): string {
    const names = [this.name];

    if (this.cause != null) {
      if (ErrorChain.isErrorChain(this.cause)) {
        names.push(this.cause.joinNames(separator));
      } else if (this.cause instanceof Error) {
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
        } else if (this.cause instanceof Error) {
          chained.push(ErrorChain.serialiseError(this.cause));
        }
      }

      return { ErrorChain: chained };
    } catch (error) {
      throw new ErrorChain({ name: EErrorChainError.Serialise }, error);
    }
  }
}
