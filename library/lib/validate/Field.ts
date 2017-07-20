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

/** Array field wrapper, uses field to validate/format array of values. */
export class ArrayField<T> implements Field {

  /** Throw error if values are not an array. */
  public static isArray(values: any): void {
    if (!Array.isArray(values)) {
      throw new ValidateError(ValidateErrorCode.InvalidArray);
    }
  }

  public constructor(private _field: Field) { }

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
