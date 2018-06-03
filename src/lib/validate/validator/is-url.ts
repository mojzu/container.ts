import { isURL } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isUrl options. */
export interface IIsUrl extends ValidatorJS.IsURLOptions {}

/** Wrapper for validator isURL. */
export function isUrl(value = "", options: IIsUrl = { require_host: true }): string {
  let isValid = false;

  try {
    isValid = isURL(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidUrl, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidUrl, value);
  }
  return value;
}

export class UrlField extends Field<string> {
  public constructor(protected readonly options: IIsUrl = { require_host: true }) {
    super();
  }
  public validate(value: string): string {
    return isUrl(value, this.options);
  }
}
