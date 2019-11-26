import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isHexadecimal. */
export function isHexadecimal(value = ""): number {
  try {
    if (validator.isHexadecimal(value) !== true) {
      throw new ValidateError(EValidateError.IsHexadecimalError, value);
    }
    return validator.toInt(value, 16);
  } catch (error) {
    throw new ValidateError(EValidateError.IsHexadecimalError, value, error);
  }
}

export class HexadecimalField extends Field<number> {
  public validate(value: string): number {
    return isHexadecimal(value);
  }
  public format(value: number): string {
    return `0x${value.toString(16)}`;
  }
}
