import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { IIsString, isString } from "./is-string";

/** Wrapper for validator isBase64. */
export function isBase64(value = "", options: IIsString = {}): string {
  try {
    if (validator.isBase64(value) !== true) {
      throw new ValidateError(EValidateError.IsBase64Error, value);
    }
    return isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.IsBase64Error, value, error);
  }
}

export class Base64Field extends Field<string> {
  public constructor(protected readonly options: IIsString = {}) {
    super();
  }
  public validate(value: string): string {
    return isBase64(value, this.options);
  }
}
