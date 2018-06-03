import { isMobilePhone as validatorIsMobilePhone } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isMobilePhone options. */
export interface IIsMobilePhone {
  /** Locale used by validator, defaults to en-GB. */
  locale?: ValidatorJS.MobilePhoneLocale;
}

/** Wrapper for validator isMobilePhone. */
export function isMobilePhone(value = "", options: IIsMobilePhone = {}): string {
  const locale = options.locale || "en-GB";
  let isValid = false;

  try {
    isValid = validatorIsMobilePhone(value, locale);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidMobilePhone, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidMobilePhone, value);
  }
  return value;
}

export class MobilePhoneField extends Field<string> {
  public constructor(protected readonly options: IIsMobilePhone = {}) {
    super();
  }
  public validate(value: string): string {
    return isMobilePhone(value, this.options);
  }
}
