import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { isCountry } from "./is-country";
import { isLanguage } from "./is-language";

/** Validate.isLocale options. */
export interface IIsLocale {
  /** Language/country code separator, defaults to '_'. */
  separator?: string;
}

/** Validate that value is a valid locale (language_COUNTRY). */
export function isLocale(value = "", options: IIsLocale = {}): string {
  const separator = options.separator || "_";
  try {
    const parts = value.split(separator);
    const language = isLanguage(parts[0]);
    const country = isCountry(parts[1]);
    return `${language}${separator}${country}`;
  } catch (error) {
    throw new ValidateError(EValidateError.IsLocaleError, value, error);
  }
}

export class LocaleField extends Field<string> {
  public constructor(protected readonly options: IIsLocale = {}) {
    super();
  }
  public validate(value: string): string {
    return isLocale(value, this.options);
  }
}
