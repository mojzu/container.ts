import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isFloat options. */
export interface IIsFloat extends validator.IsFloatOptions {}

/** Wrapper for validator isFloat. */
export function isFloat(value = "", options: IIsFloat = {}): number {
  try {
    if (validator.isFloat(value, options) !== true) {
      throw new ValidateError(EValidateError.IsFloatError, value);
    }
    return validator.toFloat(value);
  } catch (error) {
    throw new ValidateError(EValidateError.IsFloatError, value, error);
  }
}

export class FloatField extends Field<number> {
  public constructor(protected readonly options: IIsFloat = {}) {
    super();
  }
  public validate(value: string): number {
    return isFloat(value, this.options);
  }
}
