import { isISO31661Alpha2 } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate that value is a valid ISO3166-1 alpha-2 country code. */
export function isCountry(value = ""): string {
  try {
    if (isISO31661Alpha2(value) !== true) {
      throw new ValidateError(EValidateError.IsCountryError, value);
    }
    return value.toUpperCase();
  } catch (error) {
    throw new ValidateError(EValidateError.IsCountryError, value, error);
  }
}

export class CountryField extends Field<string> {
  public validate(value: string): string {
    return isCountry(value);
  }
}
