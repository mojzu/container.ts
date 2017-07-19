import * as validator from "validator";
import * as moment from "moment-timezone";

/**
 * Validation error codes enumeration.
 */
export enum ValidateErrorCode {
  InvalidBoolean,
  InvalidString,
  InvalidTimeZone,
}

/** Validation code message string or unknown. */
function validateErrorMessage(code: number, error?: any) {
  let message = ValidateErrorCode[code] || "Unknown";
  if (error != null) {
    message += `: ${error}`;
  }
  return message;
}

/** Validate error class. */
export class ValidateError extends Error {
  public thrownError?: any;
  public constructor(code: number, thrownError?: any) {
    const error: any = super(validateErrorMessage(code, thrownError));
    this.name = error.name = "ValidateError";
    this.stack = error.stack;
    this.message = error.message;
    this.thrownError = thrownError;
  }
}

/** Boolean validation options. */
export interface IValidateBooleanOptions {
  /** If true, strict validation is used. */
  strict?: boolean;
}

/** String validation options. */
export interface IValidateStringOptions {
  /** If true, string may be empty. */
  empty?: boolean;
  /** Minimum length of string. */
  minimum?: number;
  /** Maximum length of string. */
  maximum?: number;
  /** Allowed values for string. */
  values?: string[];
}

/**
 * Validation methods container.
 */
export class Validate {

  public static isBoolean(value = "", options: IValidateBooleanOptions = {}): boolean {
    const strict = !!options.strict;
    try {
      return validator.toBoolean(value, strict);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidBoolean, error);
    }
  }

  public static isString(value = "", options: IValidateStringOptions = {}): string {
    const emptyIsAllowed = !!options.empty;
    const minimum = options.minimum || 1;
    const maximum = options.maximum;
    const values = options.values || [];

    let isEmpty = false;
    let isValid = false;
    let inArray = false;

    try {
      // Validate is string of length.
      isValid = validator.isLength(value, minimum, maximum);
      // Check if empty if allowed.
      if (emptyIsAllowed) {
        isEmpty = validator.isEmpty(value);
      }
      // Check in array if provided.
      if (values.length > 0) {
        inArray = validator.isIn(value, values);
      }
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidString, error);
    }

    const notInArray = (values.length > 0) && !inArray;
    const notValid = !(emptyIsAllowed && isEmpty) && !isValid;

    if (notInArray || notValid) {
      throw new ValidateError(ValidateErrorCode.InvalidString);
    }

    return value;
  }

  public static isTimeZone(value = ""): string {
    try {
      return Validate.isString(value, { values: moment.tz.names() });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidTimeZone, error);
    }
  }

}
