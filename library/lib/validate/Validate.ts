import * as validator from "validator";

/**
 * Validation error codes enumeration.
 */
export enum ValidateErrorCode {
  InvalidString,
  InvalidArray,
}

/** Validation code message string or unknown. */
function validateErrorMessage(message?: number | string) {
  if (typeof message === "number") {
    return ValidateErrorCode[message] || "Unknown";
  } else {
    return message || "Unknown";
  }
}

/** Throw error if values are not an array. */
function validateIsArray(values: any): void {
  if (!Array.isArray(values)) {
    throw new ValidateError(ValidateErrorCode.InvalidArray);
  }
}

/** Validate error class. */
export class ValidateError extends Error {
  public constructor(message?: number | string) {
    const error: any = super(validateErrorMessage(message));
    this.name = error.name = "ValidateError";
    this.stack = error.stack;
    this.message = error.message;
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
      throw new ValidateError(error.name);
    }
  }

  public static isBooleanArray(values: string[] = [], options: IValidateBooleanOptions = {}): boolean[] {
    validateIsArray(values);
    return values.map((value) => Validate.isBoolean(value, options));
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
      throw new ValidateError(error.name);
    }

    const notInArray = (values.length > 0) && !inArray;
    const notValid = !(emptyIsAllowed && isEmpty) && !isValid;

    if (notInArray || notValid) {
      throw new ValidateError(ValidateErrorCode.InvalidString);
    }

    return value;
  }

  public static isStringArray(values: string[] = [], options: IValidateStringOptions = {}): string[] {
    validateIsArray(values);
    return values.map((value) => Validate.isString(value, options));
  }

}
