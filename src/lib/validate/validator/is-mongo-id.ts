import validator from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isMongoId. */
export function isMongoId(value = ""): string {
  try {
    if (validator.isMongoId(value) !== true) {
      throw new ValidateError(EValidateError.IsMongoIdError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsMongoIdError, value, error);
  }
}

export class MongoIdField extends Field<string> {
  public validate(value: string): string {
    return isMongoId(value);
  }
}
