
export interface IErrorChain {
  name: string;
  value?: any;
}

export interface IErrorChainItem extends IErrorChain {
  stack: string;
  message?: string;
  errno?: number;
  code?: string;
  path?: string;
  syscall?: string;
}

export interface IErrorChainSerialised {
  ErrorChain: IErrorChainItem[];
}

export class ErrorChain {

  /** Error names. */
  public static readonly ERROR = {
    SERIALISE: "SerialiseError",
    DESERIALISE: "DeserialiseError",
  };

  /** Returns true if error instance of ErrorChain. */
  public static isErrorChain(error: any): error is ErrorChain {
    return (error instanceof ErrorChain);
  }

  /** Returns true if error instance of Error or ErrorChain */
  public static isError(error: any): error is Error | ErrorChain {
    return (error instanceof Error) || (error instanceof ErrorChain);
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
      message: String(error.stack || ""),
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
  public static deserialise(serialised: IErrorChainSerialised): ErrorChain | null {
    try {
      let chained: ErrorChain | null = null;

      serialised.ErrorChain.reduceRight((p, current) => {
        chained = new ErrorChain(current, chained || undefined);
        chained = Object.assign(chained, current);
        return null;
      }, null);

      return chained;
    } catch (error) {
      throw new ErrorChain({ name: ErrorChain.ERROR.DESERIALISE, value: serialised }, error);
    }
  }

  public name: string;
  public stack?: string;
  public message?: string;
  public value?: any;
  public cause?: ErrorChain | Error;

  public constructor(data: IErrorChain, cause?: ErrorChain | Error) {
    const error = new Error(ErrorChain.messageConstructor(data, cause));
    this.name = error.name = data.name;
    this.stack = error.stack;
    this.message = error.message;
    this.value = data.value;
    this.cause = cause;
  }

  public toString(): string { return this.message || ""; }

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

  public serialise(): IErrorChainSerialised {
    try {
      // Serialise this error object.
      let chained: IErrorChainItem[] = [{
        name: this.name,
        stack: String(this.stack || ""),
        message: this.message,
      }];
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
      throw new ErrorChain({ name: ErrorChain.ERROR.SERIALISE }, error);
    }
  }

}

export default ErrorChain;
