import { isMACAddress } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isMACAddress. */
export function isMacAddress(value = ""): string {
  let isValid = false;

  try {
    isValid = isMACAddress(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidMacAddress, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidMacAddress, value);
  }
  return value;
}

export class MacAddressField extends Field<string> {
  public validate(value: string): string {
    return isMacAddress(value);
  }
}
