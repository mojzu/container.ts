import { isBase64 as validatorIsBase64 } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { IIsString, isString } from "./is-string";

/** Wrapper for validator isBase64. */
export function isBase64(value = "", options: IIsString = {}): string {
  let isValid = false;

  try {
    isValid = validatorIsBase64(value);
    value = isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidBase64, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidBase64, value);
  }
  return value;
}

export class Base64Field extends Field<string> {
  public constructor(protected readonly options: IIsString = {}) {
    super();
  }
  public validate(value: string): string {
    return isBase64(value, this.options);
  }
}
