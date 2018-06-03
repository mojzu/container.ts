import { isHexColor as validatorIsHexColor } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isHexColor. */
export function isHexColour(value = ""): string {
  let isValid = false;

  try {
    isValid = validatorIsHexColor(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidHexColour, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidHexColour, value);
  }
  return value;
}

export class HexColourField extends Field<string> {
  public validate(value: string): string {
    return isHexColour(value);
  }
}
