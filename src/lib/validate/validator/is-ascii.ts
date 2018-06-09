import { isAscii as validatorIsAscii } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { IIsString, isString } from "./is-string";

/** Wrapper for validator isAscii. */
export function isAscii(value = "", options: IIsString = {}): string {
  try {
    if (validatorIsAscii(value) !== true) {
      throw new ValidateError(EValidateError.IsAsciiError, value);
    }
    return isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.IsAsciiError, value, error);
  }
}

export class AsciiField extends Field<string> {
  public constructor(protected readonly options: IIsString = {}) {
    super();
  }
  public validate(value: string): string {
    return isAscii(value, this.options);
  }
}
