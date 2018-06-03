import { isFQDN } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isDomain options. */
export interface IIsDomain extends ValidatorJS.IsFQDNOptions {}

/** Wrapper for validator isFQDN. */
export function isDomain(value = "", options: IIsDomain = {}): string {
  let isValid = false;

  try {
    isValid = isFQDN(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.IsDomainError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsDomainError, value);
  }
  return value;
}

export class DomainField extends Field<string> {
  public constructor(protected readonly options: IIsDomain = {}) {
    super();
  }
  public validate(value: string): string {
    return isDomain(value, this.options);
  }
}
