import { ISO639 } from "../data";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { isString } from "./is-string";

/** Validate that value is a valid ISO639 language code. */
export function isLanguage(value = ""): string {
  try {
    return isString(value.toLowerCase(), { min: 2, max: 2, values: ISO639 });
  } catch (error) {
    throw new ValidateError(EValidateError.IsLanguageError, value, error);
  }
}

export class LanguageField extends Field<string> {
  public validate(value: string): string {
    return isLanguage(value);
  }
}
