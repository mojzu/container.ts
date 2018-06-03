import { isMD5 } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isMD5. */
export function isMd5(value = ""): string {
  let isValid = false;

  try {
    isValid = isMD5(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidMd5, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidMd5, value);
  }
  return value;
}

export class Md5Field extends Field<string> {
  public validate(value: string): string {
    return isMd5(value);
  }
}
