import { isInt, toInt } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isInteger options. */
export interface IIsInteger extends ValidatorJS.IsIntOptions {}

/** Wrapper for validator isInt. */
export function isInteger(value = "", options: IIsInteger = {}): number {
  try {
    if (isInt(value, options) !== true) {
      throw new ValidateError(EValidateError.IsIntegerError, value);
    }
    return toInt(value, 10);
  } catch (error) {
    throw new ValidateError(EValidateError.IsIntegerError, value, error);
  }
}

export class IntegerField extends Field<number> {
  public constructor(protected readonly options: IIsInteger = {}) {
    super();
  }
  public validate(value: string): number {
    return isInteger(value, this.options);
  }
}
