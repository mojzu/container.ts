import { isAlpha as validatorIsAlpha } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { IIsString, isString } from "./is-string";

/** Validate.isAlpha options. */
export interface IIsAlpha extends IIsString {
  /** Locale used by validator, defaults to en-GB. */
  locale?: ValidatorJS.AlphaLocale;
}

/** Wrapper for validator isAlpha. */
export function isAlpha(value = "", options: IIsAlpha = {}): string {
  const locale = options.locale || "en-GB";
  let isValid = false;

  try {
    isValid = validatorIsAlpha(value, locale);
    value = isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidAlpha, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidAlpha, value);
  }
  return value;
}

export class AlphaField extends Field<string> {
  public constructor(protected readonly options: IIsAlpha = {}) {
    super();
  }
  public validate(value: string): string {
    return isAlpha(value, this.options);
  }
}
