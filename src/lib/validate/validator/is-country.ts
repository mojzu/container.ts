import { ISO3166 } from "../data";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { isString } from "./is-string";

/** Validate that value is a valid ISO3166 country code. */
export function isCountry(value = ""): string {
  try {
    return isString(value.toUpperCase(), { min: 2, max: 2, values: ISO3166 });
  } catch (error) {
    throw new ValidateError(EValidateError.IsCountryError, value, error);
  }
}

export class CountryField extends Field<string> {
  public validate(value: string): string {
    return isCountry(value);
  }
}
