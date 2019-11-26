import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isHash options. */
export interface IIsHash {
  /** Hash algorithm to identifty, defaults to md5. */
  algorithm?: validator.HashAlgorithm;
}

/** Wrapper for validator isHash. */
export function isHash(value = "", options: IIsHash = {}): string {
  const algorithm = options.algorithm || "md5";
  try {
    if (validator.isHash(value, algorithm) !== true) {
      throw new ValidateError(EValidateError.IsHashError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsHashError, value, error);
  }
}

export class HashField extends Field<string> {
  public constructor(protected readonly options: IIsHash = {}) {
    super();
  }
  public validate(value: string): string {
    return isHash(value, this.options);
  }
}
