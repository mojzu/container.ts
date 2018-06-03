import { ErrorChain } from "../../error";

/** NodeValidate error codes. */
export enum ENodeValidateError {
  InvalidBuffer,
  InvalidFile,
  InvalidDirectory
}

/** NodeValidate error chain class. */
export class NodeValidateError extends ErrorChain {
  public constructor(code: ENodeValidateError, value?: any, cause?: Error) {
    super({ name: ENodeValidateError[code], value }, cause);
  }
}
