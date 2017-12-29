import { DateTime, DateTimeOptions, Duration, DurationOptions } from "luxon";
import * as validator from "validator";
import { ErrorChain } from "../error";
import { ISO3166, ISO639 } from "./data";

/** Validate error codes. */
export enum EValidateError {
  InvalidBoolean,
  InvalidInteger,
  InvalidFloat,
  InvalidHexadecimal,
  InvalidString,
  InvalidAscii,
  InvalidBase64,
  InvalidAlpha,
  InvalidAlphanumeric,
  InvalidCreditCard,
  InvalidEmail,
  InvalidDomain,
  InvalidHexColour,
  InvalidIp,
  InvalidJson,
  InvalidMacAddress,
  InvalidMd5,
  InvalidMobilePhone,
  InvalidMongoId,
  InvalidPostalCode,
  InvalidUrl,
  InvalidUuid,
  InvalidPort,
  InvalidLanguage,
  InvalidCountry,
  InvalidLocale,
  InvalidTimeZone,
  InvalidDateTime,
  InvalidDuration,
}

/** Validate error chain class. */
export class ValidateError extends ErrorChain {
  public constructor(code: EValidateError, value?: any, cause?: Error) {
    super({ name: EValidateError[code], value }, cause);
  }
}

/** Validate.isBoolean options. */
export interface IValidateBoolean {
  /** If true, strict validation is used. */
  strict?: boolean;
}

/** Wrapper for validator.toBoolean. */
export function isBoolean(value = "", options: IValidateBoolean = {}): boolean {
  const strict = !!options.strict;
  try {
    return validator.toBoolean(value, strict);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidBoolean, value, error);
  }
}

/** Validate.isInteger options. */
export interface IValidateInteger extends ValidatorJS.IsIntOptions { }

/** Wrapper for validator.isInt. */
export function isInteger(value = "", options: IValidateInteger = {}): number {
  let isValid = false;

  try {
    isValid = validator.isInt(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidInteger, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidInteger, value);
  }
  return validator.toInt(value, 10);
}

/** Validate.isFloat options. */
export interface IValidateFloat extends ValidatorJS.IsFloatOptions { }

/** Wrapper for validator.isFloat. */
export function isFloat(value = "", options: IValidateFloat = {}): number {
  let isValid = false;

  try {
    isValid = validator.isFloat(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidFloat, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidFloat, value);
  }
  return validator.toFloat(value);
}

/** Wrapper for validator.isHexadecimal. */
export function isHexadecimal(value = ""): number {
  let isValid = false;

  try {
    isValid = validator.isHexadecimal(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidHexadecimal, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidHexadecimal, value);
  }
  return validator.toInt(value, 16);
}

/** Validate.isString options. */
export interface IValidateString extends ValidatorJS.IsLengthOptions {
  /** Require lower case characters. */
  lowercase?: boolean;
  /** Require upper case characters. */
  uppercase?: boolean;
  /** Optional array of allowed values. */
  values?: string[];
}

/** Wrapper for validator methods isLength, isUppercase, isLowercase and isIn. */
export function isString(value = "", options: IValidateString = {}): string {
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
    isValid = validator.isLength(value, { min: options.min, max: options.max });
    // Check in values array if provided.
    if (values.length > 0) {
      isValid = isValid && validator.isIn(value, values);
    }
    // Check if uppercase/lowercase if required.
    if (uppercase && !validator.isUppercase(value)) {
      isValid = false;
    }
    if (lowercase && !validator.isLowercase(value)) {
      isValid = false;
    }
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidString, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidString, value);
  }
  return value;
}

/** Wrapper for validator.isAscii. */
export function isAscii(value = "", options: IValidateString = {}): string {
  let isValid = false;

  try {
    isValid = validator.isAscii(value);
    value = isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidAscii, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidAscii, value);
  }
  return value;
}

/** Wrapper for validator.isBase64. */
export function isBase64(value = "", options: IValidateString = {}): string {
  let isValid = false;

  try {
    isValid = validator.isBase64(value);
    value = isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidBase64, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidBase64, value);
  }
  return value;
}

/** Validate.isAlpha options. */
export interface IValidateAlpha extends IValidateString {
  /** Locale used by validator, defaults to en-GB. */
  locale?: ValidatorJS.AlphaLocale;
}

/** Wrapper for validator.isAlpha. */
export function isAlpha(value = "", options: IValidateAlpha = {}): string {
  const locale = options.locale || "en-GB";
  let isValid = false;

  try {
    isValid = validator.isAlpha(value, locale);
    value = isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidAlpha, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidAlpha, value);
  }
  return value;
}

/** Validate.isAlphanumeric options. */
export interface IValidateAlphanumeric extends IValidateString {
  /** Locale used by validator, defaults to en-GB. */
  locale?: ValidatorJS.AlphanumericLocale;
}

/** Wrapper for validator.isAlphanumeric. */
export function isAlphanumeric(value = "", options: IValidateAlphanumeric = {}): string {
  const locale = options.locale || "en-GB";
  let isValid = false;

  try {
    isValid = validator.isAlphanumeric(value, locale);
    value = isString(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidAlphanumeric, value);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidAlphanumeric, value);
  }
  return value;
}

/** Wrapper for validator.isCreditCard. */
export function isCreditCard(value = ""): string {
  let isValid = false;

  try {
    isValid = validator.isCreditCard(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidCreditCard, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidCreditCard, value);
  }
  return value;
}

/** Validate.isEmail options. */
export interface IValidateEmail extends ValidatorJS.IsEmailOptions { }

/** Wrapper for validator.isEmail. */
export function isEmail(value = "", options: IValidateEmail = {}): string {
  let isValid = false;

  try {
    isValid = validator.isEmail(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidEmail, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidEmail, value);
  }
  return value;
}

/** Validate.isDomain options. */
export interface IValidateDomain extends ValidatorJS.IsFQDNOptions { }

/** Wrapper for validator.isFQDN. */
export function isDomain(value = "", options: IValidateDomain = {}): string {
  let isValid = false;

  try {
    isValid = validator.isFQDN(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidDomain, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidDomain, value);
  }
  return value;
}

/** Wrapper for validator.isHexColor. */
export function isHexColour(value = ""): string {
  let isValid = false;

  try {
    isValid = validator.isHexColor(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidHexColour, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidHexColour, value);
  }
  return value;
}

/** Validate.isIp options. */
export interface IValidateIp {
  /** IP version number, defaults to 4. */
  version?: 4 | 6;
}

/** Wrapper for validator.isIP. */
export function isIp(value = "", options: IValidateIp = {}): string {
  const version = options.version || 4;
  let isValid = false;

  try {
    isValid = validator.isIP(value, version);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidIp, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidIp, value);
  }
  return value;
}

/** Wrapper for validator.isJSON. */
export function isJson<T>(value = ""): T {
  let isValid = false;

  try {
    isValid = validator.isJSON(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidJson, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidJson, value);
  }
  return JSON.parse(value);
}

/** Wrapper for validator.isMACAddress. */
export function isMacAddress(value = ""): string {
  let isValid = false;

  try {
    isValid = validator.isMACAddress(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidMacAddress, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidMacAddress, value);
  }
  return value;
}

/** Wrapper for validator.isMD5. */
export function isMd5(value = ""): string {
  let isValid = false;

  try {
    isValid = validator.isMD5(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidMd5, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidMd5, value);
  }
  return value;
}

/** Validate.isMobilePhone options. */
export interface IValidateMobilePhone {
  /** Locale used by validator, defaults to en-GB. */
  locale?: ValidatorJS.MobilePhoneLocale;
}

/** Wrapper for validator.isMobilePhone. */
export function isMobilePhone(value = "", options: IValidateMobilePhone = {}): string {
  const locale = options.locale || "en-GB";
  let isValid = false;

  try {
    isValid = validator.isMobilePhone(value, locale);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidMobilePhone, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidMobilePhone, value);
  }
  return value;
}

/** Wrapper for validator.isMongoId. */
export function isMongoId(value = ""): string {
  let isValid = false;

  try {
    isValid = validator.isMongoId(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidMongoId, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidMongoId, value);
  }
  return value;
}

/** Validate.isPostalCode options. */
export interface IValidatePostalCode {
  /** Locale used by validator, defaults to GB. */
  locale?: ValidatorJS.PostalCodeLocale;
}

/** Wrapper for validator.isPostalCode. */
export function isPostalCode(value = "", options: IValidatePostalCode = {}): string {
  const locale = options.locale || "GB";
  let isValid = false;

  try {
    isValid = validator.isPostalCode(value, locale);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidPostalCode, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidPostalCode, value);
  }
  return value;
}

/** Validate.isUrl options. */
export interface IValidateUrl extends ValidatorJS.IsURLOptions { }

/** Wrapper for validator.isURL. */
export function isUrl(value = "", options: IValidateUrl = { require_host: true }): string {
  let isValid = false;

  try {
    isValid = validator.isURL(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidUrl, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidUrl, value);
  }
  return value;
}

/** Validate.isUuid options. */
export interface IValidateUuid {
  /** UUID version number, defaults to all. */
  version?: 3 | 4 | 5;
}

/** Wrapper for validator.isUUID. */
export function isUuid(value = "", options: IValidateUuid = {}): string {
  const version = options.version || "all";
  let isValid = false;

  try {
    isValid = validator.isUUID(value, version);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidUuid, value, error);
  }

  if (!isValid) {
    throw new ValidateError(EValidateError.InvalidUuid, value);
  }
  return value;
}

/** Validate that value is a valid port number (1 - 65535). */
export function isPort(value = ""): number {
  try {
    return isInteger(value, { min: 0x1, max: 0xFFFF });
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidPort, value, error);
  }
}

/** Validate that value is a valid ISO639 language code. */
export function isLanguage(value = ""): string {
  try {
    return isString(value.toLowerCase(), { min: 2, max: 2, values: ISO639 });
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidLanguage, value, error);
  }
}

/** Validate that value is a valid ISO3166 country code. */
export function isCountry(value = ""): string {
  try {
    return isString(value.toUpperCase(), { min: 2, max: 2, values: ISO3166 });
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidCountry, value, error);
  }
}

/** Validate.isLocale options. */
export interface IValidateLocale {
  /** Language/country code separator, defaults to '_'. */
  separator?: string;
}

/** Validate that value is a valid locale (language_COUNTRY). */
export function isLocale(value = "", options: IValidateLocale = {}): string {
  const separator = options.separator || "_";
  try {
    const parts = value.split(separator);
    const language = isLanguage(parts[0]);
    const country = isCountry(parts[1]);
    return `${language}${separator}${country}`;
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidLocale, value, error);
  }
}

/** Validate that value is a valid time zone supported by 'luxon' library. */
export function isTimeZone(value = ""): string {
  let datetime: DateTime;

  try {
    datetime = DateTime.local().setZone(value);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidTimeZone, value, error);
  }

  if (!datetime.isValid) {
    throw new ValidateError(EValidateError.InvalidTimeZone, value);
  }
  return datetime.zoneName;
}

/** Validate.isDateTime options. */
export interface IValidateDateTime extends DateTimeOptions { }

/** Validate that value is a valid date and time parsed by 'luxon' library. */
export function isDateTime(value = "", options: IValidateDateTime = {}): DateTime {
  options.zone = options.zone || "UTC";
  let datetime: DateTime;

  try {
    datetime = DateTime.fromISO(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidDateTime, value, error);
  }

  if (!datetime.isValid) {
    throw new ValidateError(EValidateError.InvalidDateTime, value);
  }
  return datetime;
}

/** Validate.isDuration options. */
export interface IValidateDuration extends DurationOptions { }

/** Validate that value is a valid duration parsed by 'luxon' library. */
export function isDuration(value = "", options: IValidateDuration = {}): Duration {
  let duration: Duration;

  try {
    duration = Duration.fromISO(value, options);
  } catch (error) {
    throw new ValidateError(EValidateError.InvalidDuration, value, error);
  }

  if (!duration.isValid) {
    throw new ValidateError(EValidateError.InvalidDuration, value);
  }
  return duration;
}

/** Static validate methods container. */
export class Validate {
  public static isBoolean = isBoolean;
  public static isInteger = isInteger;
  public static isFloat = isFloat;
  public static isHexadecimal = isHexadecimal;
  public static isString = isString;
  public static isAscii = isAscii;
  public static isBase64 = isBase64;
  public static isAlpha = isAlpha;
  public static isAlphanumeric = isAlphanumeric;
  public static isCreditCard = isCreditCard;
  public static isEmail = isEmail;
  public static isDomain = isDomain;
  public static isHexColour = isHexColour;
  public static isIp = isIp;
  public static isJson = isJson;
  public static isMacAddress = isMacAddress;
  public static isMd5 = isMd5;
  public static isMobilePhone = isMobilePhone;
  public static isMongoId = isMongoId;
  public static isPostalCode = isPostalCode;
  public static isUrl = isUrl;
  public static isUuid = isUuid;
  public static isPort = isPort;
  public static isLanguage = isLanguage;
  public static isCountry = isCountry;
  public static isLocale = isLocale;
  public static isTimeZone = isTimeZone;
  public static isDateTime = isDateTime;
  public static isDuration = isDuration;
}
