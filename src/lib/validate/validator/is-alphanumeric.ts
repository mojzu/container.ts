import { isAlphanumeric as validatorIsAlphanumeric } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { IIsString, isString } from "./is-string";

/** Validate.isAlphanumeric options. */
export interface IIsAlphanumeric extends IIsString {
  /** Locale used by validator, defaults to en-GB. */
  locale?: ValidatorJS.AlphanumericLocale;
}

/** Wrapper for validator isAlphanumeric. */
export function isAlphanumeric(value = "", options: IIsAlphanumeric = {}): string {
  const locale = options.locale || "en-GB";
  let isValid = false;

  try {
    isValid = validatorIsAlphanumeric(value, locale);
    value = isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.IsAlphanumericError, value);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsAlphanumericError, value);
  }
  return value;
}

export class AlphanumericField extends Field<string> {
  public constructor(protected readonly options: IIsAlphanumeric = {}) {
    super();
  }
  public validate(value: string): string {
    return isAlphanumeric(value, this.options);
  }
}
