import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";
import { isInteger } from "./is-integer";

/** Validate that value is a valid port number (1 - 65535). */
export function isPort(value = ""): number {
  try {
    return isInteger(value, { min: 0x1, max: 0xffff });
  } catch (error) {
    throw new ValidateError(EValidateError.IsPortError, value, error);
  }
}

export class PortField extends Field<number> {
  public validate(value: string): number {
    return isPort(value);
  }
}
