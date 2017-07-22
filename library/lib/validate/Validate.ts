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
  InvalidIp,
  InvalidDomain,
  InvalidUrl,
  InvalidEmail,
  InvalidMongoId,
  InvalidFile,
  InvalidDirectory,
  InvalidArray,
  NodeNotAvailable,
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
  timezone?: string;
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
      throw new ValidateError(ValidateErrorCode.InvalidBoolean, error);
    }
  }

  public static isInteger(value = "", options: IValidateIntegerOptions = {}): number {
    const radix = options.radix || 10;
    let isInt = false;

    try {
      isInt = validator.isInt(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidInteger, error);
    }

    if (!isInt) {
      throw new ValidateError(ValidateErrorCode.InvalidInteger);
    }

    return parseInt(value, radix);
  }

  public static isFloat(value = "", options: IValidateNumberOptions = {}): number {
    let isFloat = false;

    try {
      isFloat = validator.isFloat(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidFloat, error);
    }

    if (!isFloat) {
      throw new ValidateError(ValidateErrorCode.InvalidFloat);
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
      throw new ValidateError(ValidateErrorCode.InvalidString, error);
    }

    const notInArray = (values.length > 0) && !inArray;
    const notValid = !(emptyIsAllowed && isEmpty) && !isValid;

    if (notInArray || notValid) {
      throw new ValidateError(ValidateErrorCode.InvalidString);
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
      throw new ValidateError(ValidateErrorCode.InvalidAscii, error);
    }

    if (!isAscii) {
      throw new ValidateError(ValidateErrorCode.InvalidAscii);
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
      throw new ValidateError(ValidateErrorCode.InvalidBase64, error);
    }

    if (!isBase64) {
      throw new ValidateError(ValidateErrorCode.InvalidBase64);
    }

    return base64;
  }

  public static isPort(value = ""): number {
    try {
      return Validate.isInteger(value, { min: 0x1, max: 0xFFFF });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidPort, error);
    }
  }

  public static isLanguage(value = ""): string {
    try {
      return Validate.isString(value.toLowerCase(), { min: 2, max: 2, values: ISO639 });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidLanguage, error);
    }
  }

  public static isCountry(value = ""): string {
    try {
      return Validate.isString(value.toUpperCase(), { min: 2, max: 2, values: ISO3166 });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidCountry, error);
    }
  }

  public static isTimeZone(value = ""): string {
    try {
      return Validate.isString(value, { values: moment.tz.names() });
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidTimeZone, error);
    }
  }

  public static isDate(value = "", options: IValidateDateOptions = {}): moment.Moment {
    const timezone = options.timezone || "Etc/UTC";
    let date: moment.Moment;

    try {
      date = moment.tz(value, timezone);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidDate, error);
    }

    if (!date.isValid()) {
      throw new ValidateError(ValidateErrorCode.InvalidDate);
    }

    return date;
  }

  public static isIp(value = "", options: IValidateIpOptions = {}): string {
    const version = options.version || 4;
    let isIp = false;

    try {
      isIp = validator.isIP(value, version);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidIp, error);
    }

    if (!isIp) {
      throw new ValidateError(ValidateErrorCode.InvalidIp);
    }

    return value;
  }

  public static isDomain(value = "", options: IValidateDomainOptions = {}): string {
    let isDomain = false;

    try {
      isDomain = validator.isFQDN(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidDomain, error);
    }

    if (!isDomain) {
      throw new ValidateError(ValidateErrorCode.InvalidDomain);
    }

    return value;
  }

  public static isUrl(value = "", options: IValidateUrlOptions = { require_host: true }): string {
    let isUrl = false;

    try {
      isUrl = validator.isURL(value, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidUrl, error);
    }

    if (!isUrl) {
      throw new ValidateError(ValidateErrorCode.InvalidUrl);
    }

    return value;
  }

  public static isEmail(value = "", options: IValidateEmailOptions = {}): string {
    let email: string;
    let isEmail = false;

    try {
      const normalised = validator.normalizeEmail(value, options);
      if (!normalised) {
        throw new ValidateError(ValidateErrorCode.InvalidEmail);
      }
      email = normalised;
      isEmail = validator.isEmail(email, options);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidEmail, error);
    }

    if (!isEmail) {
      throw new ValidateError(ValidateErrorCode.InvalidEmail);
    }

    return email;
  }

  public static isMongoId(value = ""): string {
    let isMongoId = false;

    try {
      isMongoId = validator.isMongoId(value);
    } catch (error) {
      throw new ValidateError(ValidateErrorCode.InvalidMongoId, error);
    }

    if (!isMongoId) {
      throw new ValidateError(ValidateErrorCode.InvalidMongoId);
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
      throw new ValidateError(ValidateErrorCode.InvalidFile, error);
    }

    if (!isFile) {
      throw new ValidateError(ValidateErrorCode.InvalidFile);
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
      throw new ValidateError(ValidateErrorCode.InvalidDirectory, error);
    }

    if (!isDirectory) {
      throw new ValidateError(ValidateErrorCode.InvalidDirectory);
    }

    return value;
  }

}
