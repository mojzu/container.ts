import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isMACAddress. */
export function isMacAddress(value = ""): string {
  try {
    if (validator.isMACAddress(value) !== true) {
      throw new ValidateError(EValidateError.IsMacAddressError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsMacAddressError, value, error);
  }
}

export class MacAddressField extends Field<string> {
  public validate(value: string): string {
    return isMacAddress(value);
  }
}
