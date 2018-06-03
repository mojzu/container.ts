import { isPostalCode as validatorIsPostalCode } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isPostalCode options. */
export interface IIsPostalCode {
  /** Locale used by validator, defaults to GB. */
  locale?: ValidatorJS.PostalCodeLocale;
}

/** Wrapper for validator isPostalCode. */
export function isPostalCode(value = "", options: IIsPostalCode = {}): string {
  const locale = options.locale || "GB";
  let isValid = false;

  try {
    isValid = validatorIsPostalCode(value, locale);
  } catch (error) {
    throw new ValidateError(EValidateError.IsPostalCodeError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsPostalCodeError, value);
  }
  return value;
}

export class PostalCodeField extends Field<string> {
  public constructor(protected readonly options: IIsPostalCode = {}) {
    super();
  }
  public validate(value: string): string {
    return isPostalCode(value, this.options);
  }
}
