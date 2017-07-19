import {
  ValidateErrorCode,
  ValidateError,
  IValidateBooleanOptions,
  IValidateStringOptions,
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

export class TimeZoneField extends Field {
  public validate(value: string): string {
    return Validate.isTimeZone(value);
  }
  public format(value: string): string {
    return value;
  }
}
