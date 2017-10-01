import * as moment from "moment-timezone";
import { ErrorChain } from "../error";
import {
  IValidateBooleanOptions,
  IValidateIntegerOptions,
  IValidateNumberOptions,
  IValidateStringOptions,
  IValidateLocaleOptions,
  IValidateDateOptions,
  IValidateDurationOptions,
  IValidateIpOptions,
  IValidateDomainOptions,
  IValidateUrlOptions,
  IValidateEmailOptions,
  Validate,
} from "./Validate";

/** Field error codes. */
export enum EFieldError {
  InvalidAnd,
  InvalidOr,
  InvalidNot,
}

/** Field error class. */
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
export abstract class Field<T> {
  public abstract validate(value?: string, context?: any): T | null;
  public abstract format(value: T, context?: any): string | null;
  public and(...fields: Array<Field<T>>): Field<T> {
    return new AndField<T>(this, ...fields);
  }
  public or(...fields: Array<Field<T>>): Field<T> {
    return new OrField<T>(this, ...fields);
  }
  public not(...fields: Array<Field<T>>): Field<T> {
    return this.and(this, new NotField<T>(...fields));
  }
}

/** Operator field helper. */
export abstract class OperatorField<T> extends Field<T> {
  protected _fields: Array<Field<T>>;
  public constructor(...fields: Array<Field<T>>) {
    super();
    this._fields = fields;
  }
}

/** And field wrapper, all input fields used to validate/format values. */
export class AndField<T> extends OperatorField<T> {

  public validate(value: string, context?: any): T {
    const validated = this._fields
      .map((f) => f.validate(value, context))
      .reduce((p, c) => ((p != null) ? p : c), null);

    if (validated == null) {
      throw new FieldError(EFieldError.InvalidAnd);
    }
    return validated;
  }

  public format(value: T, context?: any): string {
    const formatted = this._fields
      .map((f) => f.format(value, context))
      .reduce((p, c) => ((p != null) ? p : c), null);

    if (formatted == null) {
      throw new FieldError(EFieldError.InvalidAnd);
    }
    return formatted;
  }

}

/** Or field wrapper, at least one input field used to validate/format values. */
export class OrField<T> extends OperatorField<T> {

  public validate(value: string, context?: any): T {
    const validated = this._fields
      .map((f) => {
        try {
          return f.validate(value, context);
        } catch (error) {
          return null;
        }
      })
      .reduce((p, c) => ((p != null) ? p : c), null);

    if (validated == null) {
      throw new FieldError(EFieldError.InvalidOr);
    }
    return validated;
  }

  public format(value: T, context?: any): string {
    const formatted = this._fields
      .map((f) => {
        try {
          return f.format(value, context);
        } catch (error) {
          return null;
        }
      })
      .reduce((p, c) => ((p != null) ? p : c), null);

    if (formatted == null) {
      throw new FieldError(EFieldError.InvalidOr);
    }
    return formatted;
  }

}

/** Not field wrapper, all input fields expected to throw error/fail to format values. */
export class NotField<T> extends OperatorField<T> {

  public validate(value: string, context?: any): null {
    const validated = this._fields
      .map((f) => {
        try {
          return f.validate(value, context);
        } catch (error) {
          return null;
        }
      })
      .reduce((p, c) => ((p != null) ? p : c), null);

    if (validated != null) {
      throw new FieldError(EFieldError.InvalidNot, validated);
    }
    return validated;
  }

  public format(value: T, context?: any): null {
    const formatted = this._fields
      .map((f) => {
        try {
          return f.format(value, context);
        } catch (error) {
          return null;
        }
      })
      .reduce((p, c) => ((p != null) ? p : c), null);

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
export class OptionalField<T> extends Field<T> {

  private _formatDefault: string | null;

  public constructor(private _field: Field<T>, private _default?: T, context?: any) {
    super();
    this._formatDefault = this.format(_default, context);
  }

  public validate(value?: string, context?: any): T | null {
    if (value == null) {
      if (this._formatDefault == null) {
        return null;
      }
      return this._field.validate(this._formatDefault, context);
    }
    return this._field.validate(value, context);
  }

  public format(value?: T, context?: any): string | null {
    if (value == null) {
      if (this._default == null) {
        return null;
      }
      return this._field.format(this._default, context);
    }
    return this._field.format(value, context);
  }

}

export class BooleanField extends Field<boolean> {
  public constructor(private _options: IValidateBooleanOptions = {}) {
    super();
  }
  public validate(value: string): boolean {
    return Validate.isBoolean(value, this._options);
  }
  public format(value: boolean): string {
    return String(value);
  }
}

export class IntegerField extends Field<number> {
  public constructor(private _options: IValidateIntegerOptions = {}) {
    super();
  }
  public validate(value: string): number {
    return Validate.isInteger(value, this._options);
  }
  public format(value: number): string {
    return String(value);
  }
}

export class FloatField extends Field<number> {
  public constructor(private _options: IValidateNumberOptions = {}) {
    super();
  }
  public validate(value: string): number {
    return Validate.isFloat(value, this._options);
  }
  public format(value: number): string {
    return String(value);
  }
}

export class HexadecimalField extends Field<number> {
  public validate(value: string): number {
    return Validate.isHexadecimal(value);
  }
  public format(value: number): string {
    return String(value);
  }
}

export class StringField extends Field<string> {
  public constructor(private _options: IValidateStringOptions = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isString(value, this._options);
  }
  public format(value: string): string {
    return value;
  }
}

export class AsciiField extends Field<string> {
  public constructor(private _options: IValidateStringOptions = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isAscii(value, this._options);
  }
  public format(value: string): string {
    return value;
  }
}

export class Base64Field extends Field<string> {
  public constructor(private _options: IValidateStringOptions = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isBase64(value, this._options);
  }
  public format(value: string): string {
    return value;
  }
}

export class PortField extends Field<number> {
  public validate(value: string): number {
    return Validate.isPort(value);
  }
  public format(value: number): string {
    return String(value);
  }
}

export class LanguageField extends Field<string> {
  public validate(value: string): string {
    return Validate.isLanguage(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class CountryField extends Field<string> {
  public validate(value: string): string {
    return Validate.isCountry(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class TimeZoneField extends Field<string> {
  public validate(value: string): string {
    return Validate.isTimeZone(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class LocaleField extends Field<string> {
  public constructor(private _options: IValidateLocaleOptions = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isLocale(value, this._options);
  }
  public format(value: string): string {
    return value;
  }
}

export class DateField extends Field<moment.Moment> {
  public constructor(private _options: IValidateDateOptions = {}) {
    super();
  }
  public validate(value: string): moment.Moment {
    return Validate.isDate(value, this._options);
  }
  public format(value: moment.Moment): string {
    return value.format();
  }
}

export class DurationField extends Field<moment.Duration> {
  public constructor(private _options: IValidateDurationOptions = {}) {
    super();
  }
  public validate(value: string): moment.Duration {
    return Validate.isDuration(value, this._options);
  }
  public format(value: moment.Duration): string {
    return value.toISOString();
  }
}

export class IpField extends Field<string> {
  public constructor(private _options: IValidateIpOptions = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isIp(value, this._options);
  }
  public format(value: string): string {
    return value;
  }
}

export class DomainField extends Field<string> {
  public constructor(private _options: IValidateDomainOptions = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isDomain(value, this._options);
  }
  public format(value: string): string {
    return value;
  }
}

export class UrlField extends Field<string> {
  public constructor(private _options: IValidateUrlOptions = { require_host: true }) {
    super();
  }
  public validate(value: string): string {
    return Validate.isUrl(value, this._options);
  }
  public format(value: string): string {
    return value;
  }
}

export class EmailField extends Field<string> {
  public constructor(private _options: IValidateEmailOptions = {}) {
    super();
  }
  public validate(value: string): string {
    return Validate.isEmail(value, this._options);
  }
  public format(value: string): string {
    return value;
  }
}

export class MongoIdField extends Field<string> {
  public validate(value: string): string {
    return Validate.isMongoId(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class HexColourField extends Field<string> {
  public validate(value: string): string {
    return Validate.isHexColour(value);
  }
  public format(value: string): string {
    return value;
  }
}
