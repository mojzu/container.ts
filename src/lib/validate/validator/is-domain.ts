import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isDomain options. */
export interface IIsDomain extends validator.IsFQDNOptions {}

/** Wrapper for validator isFQDN. */
export function isDomain(value = "", options: IIsDomain = {}): string {
  try {
    if (validator.isFQDN(value, options) !== true) {
      throw new ValidateError(EValidateError.IsDomainError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsDomainError, value, error);
  }
}

export class DomainField extends Field<string> {
  public constructor(protected readonly options: IIsDomain = {}) {
    super();
  }
  public validate(value: string): string {
    return isDomain(value, this.options);
  }
}
