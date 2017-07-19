import { IValidateBooleanOptions, IValidateStringOptions, Validate } from "./Validate";

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

export class BooleanArrayField extends Field {
  public constructor(private _options: IValidateBooleanOptions = {}) {
    super();
  }
  public validate(values: string[]): boolean[] {
    return Validate.isBooleanArray(values, this._options);
  }
  public format(values: boolean[]): string[] {
    return values.map((value) => String(value));
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

export class StringArrayField extends Field {
  public constructor(private _options: IValidateStringOptions = {}) {
    super();
  }
  public validate(values: string[]): string[] {
    return Validate.isStringArray(values, this._options);
  }
  public format(values: string[]): string[] {
    return values;
  }
}
