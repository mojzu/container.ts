import { isEmail as validatorIsEmail } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isEmail options. */
export interface IIsEmail extends ValidatorJS.IsEmailOptions {}

/** Wrapper for validator isEmail. */
export function isEmail(value = "", options: IIsEmail = {}): string {
  let isValid = false;

  try {
    isValid = validatorIsEmail(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidEmail, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidEmail, value);
  }
  return value;
}

export class EmailField extends Field<string> {
  public constructor(protected readonly options: IIsEmail = {}) {
    super();
  }
  public validate(value: string): string {
    return isEmail(value, this.options);
  }
}
