import { isCreditCard as validatorIsCreditCard } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Wrapper for validator isCreditCard. */
export function isCreditCard(value = ""): string {
  let isValid = false;

  try {
    isValid = validatorIsCreditCard(value);
  } catch (error) {
    throw new ValidateError(EValidateError.IsCreditCardError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsCreditCardError, value);
  }
  return value;
}

export class CreditCardField extends Field<string> {
  public validate(value: string): string {
    return isCreditCard(value);
  }
}
