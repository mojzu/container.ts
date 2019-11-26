import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isUrl options. */
export interface IIsUrl extends validator.IsURLOptions {}

/** Wrapper for validator isURL. */
export function isUrl(value = "", options: IIsUrl = { require_host: true }): string {
  try {
    if (validator.isURL(value, options) !== true) {
      throw new ValidateError(EValidateError.IsUrlError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsUrlError, value, error);
  }
}

export class UrlField extends Field<string> {
  public constructor(protected readonly options: IIsUrl = { require_host: true }) {
    super();
  }
  public validate(value: string): string {
    return isUrl(value, this.options);
  }
}
