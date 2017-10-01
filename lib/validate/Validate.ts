import * as validator from "validator";
import * as moment from "moment-timezone";
import { ErrorChain } from "../error";
import { ISO639, ISO3166 } from "./data";

/**
 * Validation error codes enumeration.
 */
export enum EValidateErrorCode {
  InvalidBoolean,
  InvalidInteger,
  InvalidFloat,
  InvalidHexadecimal,
  InvalidString,
  InvalidAscii,
  InvalidBase64,
  InvalidPort,
  InvalidLanguage,
  InvalidCountry,
  InvalidLocale,
  InvalidTimeZone,
  InvalidDate,
  InvalidDuration,
  InvalidIp,
  InvalidDomain,
  InvalidUrl,
  InvalidEmail,
  InvalidMongoId,
  InvalidHexColour,
  InvalidAnd,
  InvalidOr,
  InvalidNot,
  InvalidSchema,
}

/** Validate error class. */
export class ValidateError extends ErrorChain {
  public constructor(code: EValidateErrorCode, value?: any, cause?: Error) {
    super({ name: EValidateErrorCode[code], value }, cause);
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
  /** Require upper case characters. */
  uppercase?: boolean;
  /** Require lower case characters. */
  lowercase?: boolean;
}

/** Locale validation options. */
export interface IValidateLocaleOptions {
  separator?: string;
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
      throw new ValidateError(EValidateErrorCode.InvalidBoolean, value, error);
    }
  }

  public static isInteger(value = "", options: IValidateIntegerOptions = {}): number {
    let isInt = false;

    try {
      isInt = validator.isInt(value, options);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidInteger, value, error);
    }

    if (!isInt) {
      throw new ValidateError(EValidateErrorCode.InvalidInteger, value);
    }

    return parseInt(value, 10);
  }

  public static isFloat(value = "", options: IValidateNumberOptions = {}): number {
    let isFloat = false;

    try {
      isFloat = validator.isFloat(value, options);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidFloat, value, error);
    }

    if (!isFloat) {
      throw new ValidateError(EValidateErrorCode.InvalidFloat, value);
    }

    return parseFloat(value);
  }

  public static isHexadecimal(value = ""): number {
    let isHexadecimal = false;

    try {
      isHexadecimal = validator.isHexadecimal(value);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidHexadecimal, value, error);
    }

    if (!isHexadecimal) {
      throw new ValidateError(EValidateErrorCode.InvalidHexadecimal, value);
    }

    return parseInt(value, 16);
  }

  public static isString(value = "", options: IValidateStringOptions = {}): string {
    const emptyIsAllowed = !!options.empty;
    const min = options.min || 1;
    const max = options.max;
    const values = options.values || [];
    const uppercase = options.uppercase || false;
    const lowercase = options.lowercase || false;

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
      // Check if uppercase/lowercase if required.
      if (uppercase) {
        if (!validator.isUppercase(value)) {
          isValid = false;
        }
      }
      if (lowercase) {
        if (!validator.isLowercase(value)) {
          isValid = false;
        }
      }
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidString, value, error);
    }

    const notInArray = (values.length > 0) && !inArray;
    const notValid = !(emptyIsAllowed && isEmpty) && !isValid;

    if (notInArray || notValid) {
      throw new ValidateError(EValidateErrorCode.InvalidString, value);
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
      throw new ValidateError(EValidateErrorCode.InvalidAscii, value, error);
    }

    if (!isAscii) {
      throw new ValidateError(EValidateErrorCode.InvalidAscii, value);
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
      throw new ValidateError(EValidateErrorCode.InvalidBase64, value, error);
    }

    if (!isBase64) {
      throw new ValidateError(EValidateErrorCode.InvalidBase64, value);
    }

    return base64;
  }

  public static isPort(value = ""): number {
    try {
      return Validate.isInteger(value, { min: 0x1, max: 0xFFFF });
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidPort, value, error);
    }
  }

  public static isLanguage(value = ""): string {
    try {
      return Validate.isString(value.toLowerCase(), { min: 2, max: 2, values: ISO639 });
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidLanguage, value, error);
    }
  }

  public static isCountry(value = ""): string {
    try {
      return Validate.isString(value.toUpperCase(), { min: 2, max: 2, values: ISO3166 });
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidCountry, value, error);
    }
  }

  public static isLocale(value = "", options: IValidateLocaleOptions = {}): string {
    const separator = options.separator || "_";

    try {
      const parts = value.split(separator);
      const language = Validate.isLanguage(parts[0]);
      const country = Validate.isCountry(parts[1]);
      return `${language}${separator}${country}`;
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidLocale, value, error);
    }
  }

  public static isTimeZone(value = ""): string {
    try {
      return Validate.isString(value, { values: moment.tz.names() });
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidTimeZone, value, error);
    }
  }

  public static isDate(value = "", options: IValidateDateOptions = {}): moment.Moment {
    const format = options.format || moment.ISO_8601;
    const timezone = options.timezone || "Etc/UTC";
    let date: moment.Moment;

    try {
      date = moment.tz(value, format, timezone);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidDate, value, error);
    }

    if (!date.isValid()) {
      throw new ValidateError(EValidateErrorCode.InvalidDate, value);
    }

    return date;
  }

  public static isDuration(value = "", options: IValidateDurationOptions = {}): moment.Duration {
    const unit = options.unit || "ms";
    try {
      return moment.duration(value, unit);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidDuration, value, error);
    }
  }

  public static isIp(value = "", options: IValidateIpOptions = {}): string {
    const version = options.version || 4;
    let isIp = false;

    try {
      isIp = validator.isIP(value, version);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidIp, value, error);
    }

    if (!isIp) {
      throw new ValidateError(EValidateErrorCode.InvalidIp, value);
    }

    return value;
  }

  public static isDomain(value = "", options: IValidateDomainOptions = {}): string {
    let isDomain = false;

    try {
      isDomain = validator.isFQDN(value, options);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidDomain, value, error);
    }

    if (!isDomain) {
      throw new ValidateError(EValidateErrorCode.InvalidDomain, value);
    }

    return value;
  }

  public static isUrl(value = "", options: IValidateUrlOptions = { require_host: true }): string {
    let isUrl = false;

    try {
      isUrl = validator.isURL(value, options);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidUrl, value, error);
    }

    if (!isUrl) {
      throw new ValidateError(EValidateErrorCode.InvalidUrl, value);
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
          throw new ValidateError(EValidateErrorCode.InvalidEmail, value);
        }
        email = normalisedEmail;
      }
      isEmail = validator.isEmail(email, options);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidEmail, value, error);
    }

    if (!isEmail) {
      throw new ValidateError(EValidateErrorCode.InvalidEmail, value);
    }

    return email;
  }

  public static isMongoId(value = ""): string {
    let isMongoId = false;

    try {
      isMongoId = validator.isMongoId(value);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidMongoId, value, error);
    }

    if (!isMongoId) {
      throw new ValidateError(EValidateErrorCode.InvalidMongoId, value);
    }

    return value;
  }

  public static isHexColour(value = ""): string {
    let isHexColour = false;

    try {
      isHexColour = validator.isHexColor(value);
    } catch (error) {
      throw new ValidateError(EValidateErrorCode.InvalidHexColour, value, error);
    }

    if (!isHexColour) {
    }

    return value;
  }

}
