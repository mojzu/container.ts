import { isIn, isLength, isLowercase, isUppercase } from "validator";
import { Field } from "../field";
import { EValidateError, ValidateError } from "../validate";

/** Validate.isString options. */
export interface IIsString extends ValidatorJS.IsLengthOptions {
  /** Require lower case characters. */
  lowercase?: boolean;
  /** Require upper case characters. */
  uppercase?: boolean;
  /** Optional array of allowed values. */
  values?: string[];
}

/** Wrapper for validator methods isLength, isUppercase, isLowercase and isIn. */
export function isString(value = "", options: IIsString = {}): string {
  const uppercase = !!options.uppercase;
  const lowercase = !!options.lowercase;
  const values = options.values || [];
  let isValid = false;

  // If minimum length is undefined, default to 1.
  // Passing undefined minimum causes empty strings to pass validation.
  if (options.min == null) {
    options.min = 1;
  }

  try {
    // Validate is string of length.
    isValid = isLength(value, { min: options.min, max: options.max });
    // Check in values array if provided.
    if (values.length > 0) {
      isValid = isValid && isIn(value, values);
    }
    // Check if uppercase/lowercase if required.
    if (uppercase && !isUppercase(value)) {
      isValid = false;
    }
    if (lowercase && !isLowercase(value)) {
      isValid = false;
    }
  } catch (error) {
    throw new ValidateError(EValidateError.IsStringError, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.IsStringError, value);
  }
  return value;
}

export class StringField extends Field<string> {
  public constructor(protected readonly options: IIsString = {}) {
    super();
  }
  public validate(value: string): string {
    return isString(value, this.options);
  }
}
