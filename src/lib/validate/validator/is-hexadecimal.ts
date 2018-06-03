import { isHexadecimal as validatorIsHexadecimal, toInt } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isHexadecimal. */
export function isHexadecimal(value = ""): number {
  let isValid = false;

  try {
    isValid = validatorIsHexadecimal(value);
  } catch (error) {
    throw new ValidateError(EValidateError.IsHexadecimalError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsHexadecimalError, value);
  }
  return toInt(value, 16);
}

export class HexadecimalField extends Field<number> {
  public validate(value: string): number {
    return isHexadecimal(value);
  }
  public format(value: number): string {
    return `0x${value.toString(16)}`;
  }
}
