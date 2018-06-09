import { isMimeType as validatorIsMimeType } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isMimeType. */
export function isMimeType(value = ""): string {
  try {
    if (validatorIsMimeType(value) !== true) {
      throw new ValidateError(EValidateError.IsMimeTypeError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsMimeTypeError, value, error);
  }
}

export class MimeTypeField extends Field<string> {
  public validate(value: string): string {
    return isMimeType(value);
  }
}
