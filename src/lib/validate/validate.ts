import { ErrorChain } from "../error";

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
  InvalidInterval
}

/** Validate error chain class. */
export class ValidateError extends ErrorChain {
  public constructor(code: EValidateError, value?: any, cause?: Error) {
    super({ name: EValidateError[code], value }, cause);
  }
}
