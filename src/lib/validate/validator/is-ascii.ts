import { isAscii as validatorIsAscii } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { IIsString, isString } from "./is-string";

/** Wrapper for validator isAscii. */
export function isAscii(value = "", options: IIsString = {}): string {
  let isValid = false;

  try {
    isValid = validatorIsAscii(value);
    value = isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.IsAsciiError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsAsciiError, value);
  }
  return value;
}

export class AsciiField extends Field<string> {
  public constructor(protected readonly options: IIsString = {}) {
    super();
  }
  public validate(value: string): string {
    return isAscii(value, this.options);
  }
}
