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
  try {
    if (validatorIsAlpha(value, locale) !== true) {
      throw new ValidateError(EValidateError.IsAlphaError, value);
    }
    return isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.IsAlphaError, value, error);
  }
}

export class AlphaField extends Field<string> {
  public constructor(protected readonly options: IIsAlpha = {}) {
    super();
  }
  public validate(value: string): string {
    return isAlpha(value, this.options);
  }
}
