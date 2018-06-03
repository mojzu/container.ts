import { isMongoId as validatorIsMongoId } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isMongoId. */
export function isMongoId(value = ""): string {
  let isValid = false;

  try {
    isValid = validatorIsMongoId(value);
  } catch (error) {
    throw new ValidateError(EValidateError.IsMongoIdError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsMongoIdError, value);
  }
  return value;
}

export class MongoIdField extends Field<string> {
  public validate(value: string): string {
    return isMongoId(value);
  }
}
