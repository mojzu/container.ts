import { isCreditCard as validatorIsCreditCard } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isCreditCard. */
export function isCreditCard(value = ""): string {
  try {
    if (validatorIsCreditCard(value) !== true) {
      throw new ValidateError(EValidateError.IsCreditCardError, value);
    }
    return value;
  } catch (error) {
    throw new ValidateError(EValidateError.IsCreditCardError, value, error);
  }
}

export class CreditCardField extends Field<string> {
  public validate(value: string): string {
    return isCreditCard(value);
  }
}
