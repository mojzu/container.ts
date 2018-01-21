import { DateTime, Duration, Interval } from "luxon";
import * as validator from "validator";
import { ErrorChain } from "../error";
import { ISchemaConstructor, ISchemaMask } from "./Schema";
import * as Validate from "./Validate";

// TODO(H): Improve operator field documentation/testing.

/** Field error codes. */
export enum EFieldError {
  InvalidAnd,
  InvalidOr,
  InvalidNot,
  InvalidOptional,
}

/** Field error chain class. */
export class FieldError extends ErrorChain {
  public constructor(code: EFieldError, value?: any, cause?: Error) {
    super({ name: EFieldError[code], value }, cause);
  }
}

/**
 * Fields have validate and format methods.
 * Validate method takes string input and returns typed output.
 * Format method takes typed input and returns string output.
 * Optional context available for additional validation/formatting information.
 */
export abstract class Field<T, K = object> {

  public abstract validate(value?: string | object, context?: K): T | null;

  public format(value: T, context?: K): string | object | null {
    return validator.toString(value);
  }

  public and(...fields: Array<Field<T, K>>): Field<T, K> {
    return new AndField<T, K>(this, ...fields);
  }

  public or(...fields: Array<Field<T, K>>): Field<T, K> {
    return new OrField<T, K>(this, ...fields);
  }

  public not(...fields: Array<Field<T, K>>): Field<T, K> {
    return this.and(this, new NotField<T, K>(...fields));
  }

}

/** Operator field helper. */
export abstract class OperatorField<T, K> extends Field<T, K> {
  protected readonly fields: Array<Field<T, K>>;
  public constructor(...fields: Array<Field<T, K>>) {
    super();
    this.fields = fields;
  }
}

/** And field wrapper, all input fields used to validate/format values. */
export class AndField<T, K> extends OperatorField<T, K> {

  public validate(value: string, context?: K): T {
    let validated: T | null;
    try {
      validated = this.fields
        .map((f) => f.validate(value, context))
        .reduce((p, c) => ((p != null) ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.InvalidAnd, value, error);
    }
    if (validated == null) {
      throw new FieldError(EFieldError.InvalidAnd, value);
    }
    return validated;
  }

  public format(value: T, context?: K): string | object {
    let formatted: string | object | null;
    try {
      formatted = this.fields
        .map((f) => f.format(value, context))
        .reduce((p, c) => ((p != null) ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.InvalidAnd, value, error);
    }
    if (formatted == null) {
      throw new FieldError(EFieldError.InvalidAnd, value);
    }
    return formatted;
  }

}

/** Or field wrapper, at least one input field used to validate/format values. */
export class OrField<T, K> extends OperatorField<T, K> {

  public validate(value: string, context?: any): T {
    let validated: T | null;
    try {
      validated = this.fields
        .map((f) => {
          try {
            return f.validate(value, context);
          } catch (error) {
            return null;
          }
        })
        .reduce((p, c) => ((p != null) ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.InvalidOr, value, error);
    }
    if (validated == null) {
      throw new FieldError(EFieldError.InvalidOr);
    }
    return validated;
  }

  public format(value: T, context?: any): string | object {
    let formatted: string | object | null;
    try {
      formatted = this.fields
        .map((f) => {
          try {
            return f.format(value, context);
          } catch (error) {
            return null;
          }
        })
        .reduce((p, c) => ((p != null) ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.InvalidOr, value, error);
    }
    if (formatted == null) {
      throw new FieldError(EFieldError.InvalidOr);
    }
    return formatted;
  }

}

/** Not field wrapper, all input fields expected to throw error/fail to format values. */
export class NotField<T, K> extends OperatorField<T, K> {

  public validate(value: string, context?: any): null {
    let validated: T | null;
    try {
      validated = this.fields
        .map((f) => {
          try {
            return f.validate(value, context);
          } catch (error) {
            return null;
          }
        })
        .reduce((p, c) => ((p != null) ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.InvalidNot, value, error);
    }
    if (validated != null) {
      throw new FieldError(EFieldError.InvalidNot, validated);
    }
    return validated;
  }

  public format(value: T, context?: any): null {
    let formatted: string | object | null;
    try {
      formatted = this.fields
        .map((f) => {
          try {
            return f.format(value, context);
          } catch (error) {
            return null;
          }
        })
        .reduce((p, c) => ((p != null) ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.InvalidNot, value, error);
    }
    if (formatted != null) {
      throw new FieldError(EFieldError.InvalidNot, formatted);
    }
    return formatted;
  }

}

/**
 * Optional field wrapper, if value is defined uses field to validate/format.
 * If value is undefined default or null value is returned.
 */
export class OptionalField<T, K> extends Field<T, K> {

  protected readonly formatDefault: string | object | null;

  public constructor(
    protected readonly field: Field<T, K>,
    protected readonly defaultValue?: T,
    context?: any,
  ) {
    super();
    this.formatDefault = this.format(defaultValue, context);
  }

  public validate(value?: string, context?: any): T | null {
    try {
      if (value == null) {
        if (this.formatDefault == null) {
          return null;
        }
        return this.field.validate(this.formatDefault, context);
      }
      return this.field.validate(value, context);
    } catch (error) {
      throw new FieldError(EFieldError.InvalidOptional, value, error);
    }
  }

  public format(value?: T, context?: any): string | object | null {
    try {
      if (value == null) {
        if (this.defaultValue == null) {
          return null;
        }
        return this.field.format(this.defaultValue, context);
      }
      return this.field.format(value, context);
    } catch (error) {
      throw new FieldError(EFieldError.InvalidOptional, value, error);
    }
  }

}

export interface ISchemaFieldContext {
  mask?: ISchemaMask;
  keyRoot?: string;
}

export class SchemaField<T = object> extends Field<T> {
  public constructor(protected readonly schema: ISchemaConstructor) {
    super();
  }
  public validate(value: object, context: ISchemaFieldContext = {}): T {
    return this.schema.validate(value, context.mask, context.keyRoot);
  }
  public format(value: T, context: ISchemaFieldContext): object {
    return this.schema.format(value, context.mask, context.keyRoot);
  }
}

export class BooleanField extends Field<boolean> {
  public constructor(protected readonly options: Validate.IValidateBoolean = {}) {
    super();
  }
  public validate(value: string): boolean {
    return Validate.isBoolean(value, this.options);
  }
}

export class IntegerField extends Field<number> {
  public constructor(protected readonly options: Validate.IValidateInteger = {}) {
    super();
  }
  public validate(value: string): number {
    return Validate.isInteger(value, this.options);
  }
}

export class FloatField extends Field<number> {
  public constructor(protected readonly options: Validate.IValidateFloat = {}) {
    super();
  }
  public validate(value: string): number {
    return Validate.isFloat(value, this.options);
  }
}

export class HexadecimalField extends Field<number> {
  public validate(value: string): number {
    return Validate.isHexadecimal(value);
  }
  public format(value: number): string {
    return `0x${value.toString(16)}`;
  }
}

export class StringField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateString = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isString(value, this.options);
  }
}

export class AsciiField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateString = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isAscii(value, this.options);
  }
}

export class Base64Field extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateString = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isBase64(value, this.options);
  }
}

export class AlphaField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateAlpha = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isAlpha(value, this.options);
  }
}

export class AlphanumericField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateAlphanumeric = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isAlphanumeric(value, this.options);
  }
}

export class CreditCardField extends Field<string> {
  public validate(value: string): string {
    return Validate.isCreditCard(value);
  }
}

export class EmailField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateEmail = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isEmail(value, this.options);
  }
}

export class DomainField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateDomain = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isDomain(value, this.options);
  }
}

export class HexColourField extends Field<string> {
  public validate(value: string): string {
    return Validate.isHexColour(value);
  }
}

export class IpField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateIp = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isIp(value, this.options);
  }
}

export class JsonField<T> extends Field<T> {
  public validate(value: string): T {
    return Validate.isJson<T>(value);
  }
  public format(value: T): string {
    return JSON.stringify(value);
  }
}

export class MacAddressField extends Field<string> {
  public validate(value: string): string {
    return Validate.isMacAddress(value);
  }
}

export class Md5Field extends Field<string> {
  public validate(value: string): string {
    return Validate.isMd5(value);
  }
}

export class MobilePhoneField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateMobilePhone = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isMobilePhone(value, this.options);
  }
}

export class MongoIdField extends Field<string> {
  public validate(value: string): string {
    return Validate.isMongoId(value);
  }
}

export class PostalCodeField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidatePostalCode = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isPostalCode(value, this.options);
  }
}

export class UrlField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateUrl = { require_host: true }) {
    super();
  }
  public validate(value: string): string {
    return Validate.isUrl(value, this.options);
  }
}

export class UuidField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateUuid = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isUuid(value, this.options);
  }
}

export class PortField extends Field<number> {
  public validate(value: string): number {
    return Validate.isPort(value);
  }
}

export class LanguageField extends Field<string> {
  public validate(value: string): string {
    return Validate.isLanguage(value);
  }
}

export class CountryField extends Field<string> {
  public validate(value: string): string {
    return Validate.isCountry(value);
  }
}

export class LocaleField extends Field<string> {
  public constructor(protected readonly options: Validate.IValidateLocale = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isLocale(value, this.options);
  }
}

export class TimeZoneField extends Field<string> {
  public validate(value: string): string {
    return Validate.isTimeZone(value);
  }
}

export class DateTimeField extends Field<DateTime> {
  public constructor(protected readonly options: Validate.IValidateDateTime = {}) {
    super();
  }
  public validate(value: string): DateTime {
    return Validate.isDateTime(value, this.options);
  }
  public format(value: DateTime): string {
    return value.toISO();
  }
}

export class DurationField extends Field<Duration> {
  public constructor(protected readonly options: Validate.IValidateDuration = {}) {
    super();
  }
  public validate(value: string): Duration {
    return Validate.isDuration(value, this.options);
  }
  public format(value: Duration): string {
    return value.toISO();
  }
}

export class IntervalField extends Field<Interval> {
  public constructor(protected readonly options: Validate.IValidateInterval = {}) {
    super();
  }
  public validate(value: string): Interval {
    return Validate.isInterval(value, this.options);
  }
  public format(value: Interval): string {
    return value.toISO();
  }
}
