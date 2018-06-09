import { isPort as validatorIsPort, toInt } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate that value is a valid port number. */
export function isPort(value = ""): number {
  try {
    if (validatorIsPort(value) !== true) {
      throw new ValidateError(EValidateError.IsPortError, value);
    }
    return toInt(value, 10);
  } catch (error) {
    throw new ValidateError(EValidateError.IsPortError, value, error);
  }
}

export class PortField extends Field<number> {
  public validate(value: string): number {
    return isPort(value);
  }
}
