import * as moment from "moment-timezone";
import {
  ValidateErrorCode,
  ValidateError,
  IValidateBooleanOptions,
  IValidateIntegerOptions,
  IValidateNumberOptions,
  IValidateStringOptions,
  IValidateDateOptions,
  IValidateIpOptions,
  IValidateDomainOptions,
  IValidateUrlOptions,
  IValidateEmailOptions,
  Validate,
} from "./Validate";

// TODO: OrField wrapper.

/**
 * Fields have validate and format methods.
 * Validate method takes string input and returns typed output.
 * Format method takes typed input and returns string output.
 * Optional context available for additional validation/formatting information.
 */
export abstract class Field {
  public abstract validate(value: any, context?: any): any;
  public abstract format(value: any, context?: any): any;
}

/**
 * Optional field wrapper, if value is defined uses field to validate/format.
 * If value is undefined default or null value is returned.
 */
export class OptionalField<T> extends Field {

  private _formatDefault: string | null;

  public constructor(private _field: Field, private _default?: T, context?: any) {
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

/**
 * Array field wrapper, uses field to validate/format array of values.
 */
export class ArrayField<T> extends Field {

  /** Throw error if values are not an array. */
  public static isArray(values: any): void {
    if (!Array.isArray(values)) {
      throw new ValidateError(ValidateErrorCode.InvalidArray);
    }
  }

  public constructor(private _field: Field) {
    super();
  }

  public validate(values: string[], context?: any): T[] {
    ArrayField.isArray(values);
    return values.map((v) => this._field.validate(v, context));
  }

  public format(values: T[], context?: any): string[] {
    ArrayField.isArray(values);
    return values.map((v) => this._field.format(v, context));
  }

}

export class BooleanField extends Field {
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

export class IntegerField extends Field {
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

export class FloatField extends Field {
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

export class StringField extends Field {
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

export class AsciiField extends Field {
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

export class Base64Field extends Field {
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

export class PortField extends Field {
  public validate(value: string): number {
    return Validate.isPort(value);
  }
  public format(value: number): string {
    return String(value);
  }
}

export class LanguageField extends Field {
  public validate(value: string): string {
    return Validate.isLanguage(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class CountryField extends Field {
  public validate(value: string): string {
    return Validate.isCountry(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class TimeZoneField extends Field {
  public validate(value: string): string {
    return Validate.isTimeZone(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class DateField extends Field {
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

export class IpField extends Field {
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

export class DomainField extends Field {
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

export class UrlField extends Field {
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

export class EmailField extends Field {
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

export class MongoIdField extends Field {
  public validate(value: string): string {
    return Validate.isMongoId(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class FileField extends Field {
  public validate(value: string): string {
    return Validate.isFile(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class DirectoryField extends Field {
  public validate(value: string): string {
    return Validate.isDirectory(value);
  }
  public format(value: string): string {
    return value;
  }
}
