import { isJSON } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isJSON. */
export function isJson<T>(value = ""): T {
  try {
    if (isJSON(value) !== true) {
      throw new ValidateError(EValidateError.IsJsonError, value);
    }
    return JSON.parse(value);
  } catch (error) {
    throw new ValidateError(EValidateError.IsJsonError, value, error);
  }
}

export class JsonField<T> extends Field<T> {
  public validate(value: string): T {
    return isJson<T>(value);
  }
  public format(value: T): string {
    return JSON.stringify(value);
  }
}
