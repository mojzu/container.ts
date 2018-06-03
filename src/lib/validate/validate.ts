import { ErrorChain } from "../error";

/** Validate error codes. */
export enum EValidateError {
  IsAlphaError,
  IsAlphanumericError,
  IsAsciiError,
  IsBase64Error,
  IsBooleanError,
  IsCountryError,
  IsCreditCardError,
  IsDateTimeError,
  IsDomainError,
  IsDurationError,
  IsEmailError,
  IsFloatError,
  IsHexColourError,
  IsHexadecimalError,
  IsIntegerError,
  IsIntervalError,
  IsIpError,
  IsJsonError,
  IsLanguageError,
  IsLocaleError,
  IsMacAddressError,
  IsMd5Error,
  IsMobilePhoneError,
  IsMongoIdError,
  IsPortError,
  IsPostalCodeError,
  IsStringError,
  IsTimeZoneError,
  IsUrlError,
  IsUuidError
}

/** Validate error chain class. */
export class ValidateError extends ErrorChain {
  public constructor(code: EValidateError, value?: any, cause?: Error) {
    super({ name: EValidateError[code], value }, cause);
  }
}
