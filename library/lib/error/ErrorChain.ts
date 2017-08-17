
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

export class ErrorChain extends Error {

  /** Error names. */
  public static ERROR = {
    SERIALISE: "SerialiseError",
    DESERIALISE: "DeserialiseError",
  };

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
      }, null);

      return chained;
    } catch (error) {
      throw new ErrorChain({ name: ErrorChain.ERROR.DESERIALISE, value: serialised }, error);
    }
  }

  public value?: any;
  public cause?: ErrorChain | Error;

  public constructor(data: IErrorChain, cause?: ErrorChain | Error) {
    const error: any = super(ErrorChain.messageConstructor(data, cause));
    this.name = error.name = data.name;
    this.stack = error.stack;
    this.message = error.message;
    this.value = data.value;
    this.cause = cause;
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
        if (this.cause instanceof ErrorChain) {
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
