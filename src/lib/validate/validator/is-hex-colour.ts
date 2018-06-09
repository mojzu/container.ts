import { isHexColor as validatorIsHexColor } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isHexColor. */
export function isHexColour(value = ""): string {
  try {
    if (validatorIsHexColor(value) !== true) {
      throw new ValidateError(EValidateError.IsHexColourError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsHexColourError, value, error);
  }
}

export class HexColourField extends Field<string> {
  public validate(value: string): string {
    return isHexColour(value);
  }
}
