import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isEmail options. */
export interface IIsEmail extends validator.IsEmailOptions {}

/** Wrapper for validator isEmail. */
export function isEmail(value = "", options: IIsEmail = {}): string {
  try {
    if (validator.isEmail(value, options) !== true) {
      throw new ValidateError(EValidateError.IsEmailError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsEmailError, value, error);
  }
}

export class EmailField extends Field<string> {
  public constructor(protected readonly options: IIsEmail = {}) {
    super();
  }
  public validate(value: string): string {
    return isEmail(value, this.options);
  }
}
