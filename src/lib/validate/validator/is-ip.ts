import { isIP } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isIp options. */
export interface IIsIp {
  /** IP version number, defaults to 4. */
  version?: 4 | 6;
}

/** Wrapper for validator isIP. */
export function isIp(value = "", options: IIsIp = {}): string {
  const version = options.version || 4;
  let isValid = false;

  try {
    isValid = isIP(value, version);
  } catch (error) {
    throw new ValidateError(EValidateError.IsIpError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsIpError, value);
  }
  return value;
}

export class IpField extends Field<string> {
  public constructor(protected readonly options: IIsIp = {}) {
    super();
  }
  public validate(value: string): string {
    return isIp(value, this.options);
  }
}
