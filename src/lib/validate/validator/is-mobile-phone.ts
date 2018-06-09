import { isMobilePhone as validatorIsMobilePhone } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isMobilePhone options. */
export interface IIsMobilePhone extends ValidatorJS.IsMobilePhoneOptions {
  /** Locale used by validator, defaults to en-GB. */
  locale?: ValidatorJS.MobilePhoneLocale;
}

/** Wrapper for validator isMobilePhone. */
export function isMobilePhone(value = "", options: IIsMobilePhone = {}): string {
  const locale = options.locale || "en-GB";
  try {
    if (validatorIsMobilePhone(value, locale, options) !== true) {
      throw new ValidateError(EValidateError.IsMobilePhoneError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsMobilePhoneError, value, error);
  }
}

export class MobilePhoneField extends Field<string> {
  public constructor(protected readonly options: IIsMobilePhone = {}) {
    super();
  }
  public validate(value: string): string {
    return isMobilePhone(value, this.options);
  }
}
