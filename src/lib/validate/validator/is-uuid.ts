import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isUuid options. */
export interface IIsUuid {
  /** UUID version number, defaults to all. */
  version?: 3 | 4 | 5 | "all";
}

/** Wrapper for validator isUUID. */
export function isUuid(value = "", options: IIsUuid = {}): string {
  const version = options.version || "all";
  try {
    if (validator.isUUID(value, version) !== true) {
      throw new ValidateError(EValidateError.IsUuidError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsUuidError, value, error);
  }
}

export class UuidField extends Field<string> {
  public constructor(protected readonly options: IIsUuid = {}) {
    super();
  }
  public validate(value: string): string {
    return isUuid(value, this.options);
  }
}
