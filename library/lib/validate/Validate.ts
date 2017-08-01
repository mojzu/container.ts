import * as validator from "validator";
import * as moment from "moment-timezone";
import { ISO639, ISO3166 } from "./data";

// Conditionally import node for file/directory validators.
const nodePath = (typeof window === "undefined") ? require("path") : null;
const nodeFs = (typeof window === "undefined") ? require("fs") : null;

/**
 * Validation error codes enumeration.
 */
export enum ValidateErrorCode {
  InvalidBoolean,
  InvalidFloat,
  InvalidInteger,
  InvalidString,
  InvalidAscii,
  InvalidBase64,
  InvalidPort,
  InvalidLanguage,
  InvalidCountry,
  InvalidTimeZone,
  InvalidDate,
  InvalidDuration,
  InvalidIp,
  InvalidDomain,
  InvalidUrl,
  InvalidEmail,
  InvalidMongoId,
  InvalidFile,
  InvalidDirectory,
  InvalidArray,
  InvalidAnd,
  InvalidOr,
  NodeNotAvailable,
}

/** Validation code message string or unknown. */
function validateErrorMessage(code: number, value?: any, error?: any) {
  let message = ValidateErrorCode[code] || "Unknown";
  if (value != null) {
    message += ` "${value}"`;
  }
  if (error != null) {
    message += `: ${error}`;
  }
  return message;
}

/** Validate error class. */
export class ValidateError extends Error {
  public thrownError?: any;
  public constructor(code: number, value?: any, thrownError?: any) {
    const error: any = super(validateErrorMessage(code, value, thrownError));
    this.name = error.name = "ValidateError";
    this.stack = error.stack;
    this.message = error.message;
    this.thrownError = thrownError;
  }
}

/** Test that node file system is available. */
function checkNodeAvailable(): void {
  if ((nodePath == null) && (nodeFs == null)) {
    throw new ValidateError(ValidateErrorCode.NodeNotAvailable);
  }
}

/** Boolean validation options. */
export interface IValidateBooleanOptions {
  /** If true, strict validation is used. */
  strict?: boolean;
}

/** Number validation options. */
export interface IValidateNumberOptions {
  min?: number;
  max?: number;
}

/** Integer validation options. */
export interface IValidateIntegerOptions extends IValidateNumberOptions {
  allow_leading_zeroes?: boolean;
  lt?: number;
  gt?: number;
  radix?: number;
}

/** String validation options. */
export interface IValidateStringOptions {
  /** If true, string may be empty. */
  empty?: boolean;
  /** Minimum length of string. */
  min?: number;
  /** Maximum length of string. */
  max?: number;
  /** Allowed values for string. */
  values?: string[];
}

/** Date validation options. */
export interface IValidateDateOptions {
  format?: string | string[];
  timezone?: string;
}

/** Duration validation options. */
export interface IValidateDurationOptions {
  unit?: moment.unitOfTime.DurationConstructor;
}

/** IP validation options. */
export interface IValidateIpOptions {
  version?: number;
}

/** Domain validation options. */
export interface IValidateDomainOptions {
  require_tld?: boolean;
  allow_underscores?: boolean;
  allow_trailing_dot?: boolean;
}

/** URL validation options. */
export interface IValidateUrlOptions {
  protocols?: string[];
  require_tld?: boolean;
  require_protocol?: boolean;
  require_host: boolean;
  require_valid_protocol?: boolean;
  allow_underscores?: boolean;
  host_whitelist?: Array<string | RegExp>;
  host_blacklist?: Array<string | RegExp>;
  allow_trailing_dot?: boolean;
  allow_protocol_relative_urls?: boolean;
}

/** Email validation options. */
export interface IValidateEmailOptions {
  normalise?: boolean;
  lowercase?: boolean;
  remove_dots?: boolean;
  remove_extension?: boolean;
  allow_display_name?: boolean;
  allow_utf8_local_part?: boolean;
  require_tld?: boolean;
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
      throw new ValidateError(ValidateErrorCode.InvalidBoolean, value, error);
    }
  }

  public static isInteger(value = "", options: IValidateIntegerOptions = {}): number {
    const radix = options.radix || 10;
    let isInt = false;

    try {
      isInt = validator.isInt(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidInteger, value, error);
    }

    if (!isInt) {
      throw new ValidateError(ValidateErrorCode.InvalidInteger, value);
    }

    return parseInt(value, radix);
  }

  public static isFloat(value = "", options: IValidateNumberOptions = {}): number {
    let isFloat = false;

    try {
      isFloat = validator.isFloat(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidFloat, value, error);
    }

    if (!isFloat) {
      throw new ValidateError(ValidateErrorCode.InvalidFloat, value);
    }

    return parseFloat(value);
  }

  public static isString(value = "", options: IValidateStringOptions = {}): string {
    const emptyIsAllowed = !!options.empty;
    const min = options.min || 1;
    const max = options.max;
    const values = options.values || [];

    let isEmpty = false;
    let isValid = false;
    let inArray = false;

    try {
      // Validate is string of length.
      isValid = validator.isLength(value, min, max);
      // Check if empty if allowed.
      if (emptyIsAllowed) {
        isEmpty = validator.isEmpty(value);
      }
      // Check in array if provided.
      if (values.length > 0) {
        inArray = validator.isIn(value, values);
      }
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidString, value, error);
    }

    const notInArray = (values.length > 0) && !inArray;
    const notValid = !(emptyIsAllowed && isEmpty) && !isValid;

    if (notInArray || notValid) {
      throw new ValidateError(ValidateErrorCode.InvalidString, value);
    }

    return value;
  }

  public static isAscii(value = "", options: IValidateStringOptions = {}): string {
    let isAscii = false;
    let ascii: string;

    try {
      isAscii = validator.isAscii(value);
      ascii = Validate.isString(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidAscii, value, error);
    }

    if (!isAscii) {
      throw new ValidateError(ValidateErrorCode.InvalidAscii, value);
    }

    return ascii;
  }

  public static isBase64(value = "", options: IValidateStringOptions = {}): string {
    let isBase64 = false;
    let base64: string;

    try {
      isBase64 = validator.isBase64(value);
      base64 = Validate.isString(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidBase64, value, error);
    }

    if (!isBase64) {
      throw new ValidateError(ValidateErrorCode.InvalidBase64, value);
    }

    return base64;
  }

  public static isPort(value = ""): number {
    try {
      return Validate.isInteger(value, { min: 0x1, max: 0xFFFF });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidPort, value, error);
    }
  }

  public static isLanguage(value = ""): string {
    try {
      return Validate.isString(value.toLowerCase(), { min: 2, max: 2, values: ISO639 });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidLanguage, value, error);
    }
  }

  public static isCountry(value = ""): string {
    try {
      return Validate.isString(value.toUpperCase(), { min: 2, max: 2, values: ISO3166 });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidCountry, value, error);
    }
  }

  public static isTimeZone(value = ""): string {
    try {
      return Validate.isString(value, { values: moment.tz.names() });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidTimeZone, value, error);
    }
  }

  public static isDate(value = "", options: IValidateDateOptions = {}): moment.Moment {
    const format = options.format || moment.ISO_8601;
    const timezone = options.timezone || "Etc/UTC";
    let date: moment.Moment;

    try {
      date = moment.tz(value, format, timezone);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidDate, value, error);
    }

    if (!date.isValid()) {
      throw new ValidateError(ValidateErrorCode.InvalidDate, value);
    }

    return date;
  }

  public static isDuration(value = "", options: IValidateDurationOptions = {}): moment.Duration {
    const unit = options.unit || "ms";
    try {
      return moment.duration(value, unit);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidDuration, value, error);
    }
  }

  public static isIp(value = "", options: IValidateIpOptions = {}): string {
    const version = options.version || 4;
    let isIp = false;

    try {
      isIp = validator.isIP(value, version);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidIp, value, error);
    }

    if (!isIp) {
      throw new ValidateError(ValidateErrorCode.InvalidIp, value);
    }

    return value;
  }

  public static isDomain(value = "", options: IValidateDomainOptions = {}): string {
    let isDomain = false;

    try {
      isDomain = validator.isFQDN(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidDomain, value, error);
    }

    if (!isDomain) {
      throw new ValidateError(ValidateErrorCode.InvalidDomain, value);
    }

    return value;
  }

  public static isUrl(value = "", options: IValidateUrlOptions = { require_host: true }): string {
    let isUrl = false;

    try {
      isUrl = validator.isURL(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidUrl, value, error);
    }

    if (!isUrl) {
      throw new ValidateError(ValidateErrorCode.InvalidUrl, value);
    }

    return value;
  }

  public static isEmail(value = "", options: IValidateEmailOptions = {}): string {
    const normalise = options.normalise || false;
    let email: string;
    let isEmail = false;

    try {
      email = value;
      if (normalise) {
        const normalisedEmail = validator.normalizeEmail(value, options);
        if (!normalisedEmail) {
          throw new ValidateError(ValidateErrorCode.InvalidEmail, value);
        }
        email = normalisedEmail;
      }
      isEmail = validator.isEmail(email, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidEmail, value, error);
    }

    if (!isEmail) {
      throw new ValidateError(ValidateErrorCode.InvalidEmail, value);
    }

    return email;
  }

  public static isMongoId(value = ""): string {
    let isMongoId = false;

    try {
      isMongoId = validator.isMongoId(value);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidMongoId, value, error);
    }

    if (!isMongoId) {
      throw new ValidateError(ValidateErrorCode.InvalidMongoId, value);
    }

    return value;
  }

  public static isFile(value = ""): string {
    checkNodeAvailable();
    let isFile = false;

    try {
      value = nodePath.resolve(value);
      isFile = nodeFs.lstatSync(value).isFile();
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidFile, value, error);
    }

    if (!isFile) {
      throw new ValidateError(ValidateErrorCode.InvalidFile, value);
    }

    return value;
  }

  public static isDirectory(value = ""): string {
    checkNodeAvailable();
    let isDirectory = false;

    try {
      value = nodePath.resolve(value);
      isDirectory = nodeFs.lstatSync(value).isDirectory();
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidDirectory, value, error);
    }

    if (!isDirectory) {
      throw new ValidateError(ValidateErrorCode.InvalidDirectory, value);
    }

    return value;
  }

}
