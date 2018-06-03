import { isInt, toInt } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isInteger options. */
export interface IIsInteger extends ValidatorJS.IsIntOptions {}

/** Wrapper for validator isInt. */
export function isInteger(value = "", options: IIsInteger = {}): number {
  let isValid = false;

  try {
    isValid = isInt(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.IsIntegerError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsIntegerError, value);
  }
  return toInt(value, 10);
}

export class IntegerField extends Field<number> {
  public constructor(protected readonly options: IIsInteger = {}) {
    super();
  }
  public validate(value: string): number {
    return isInteger(value, this.options);
  }
}
