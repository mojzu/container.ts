import { toBoolean } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isBoolean options. */
export interface IIsBoolean {
  /** If true, strict validation is used. */
  strict?: boolean;
}

/** Wrapper for validator toBoolean. */
export function isBoolean(value = "", options: IIsBoolean = {}): boolean {
  const strict = !!options.strict;
  try {
    return toBoolean(value, strict);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidBoolean, value, error);
  }
}

export class BooleanField extends Field<boolean> {
  public constructor(protected readonly options: IIsBoolean = {}) {
    super();
  }
  public validate(value: string): boolean {
    return isBoolean(value, this.options);
  }
}
