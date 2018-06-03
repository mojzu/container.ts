import { toString } from "validator";
import { ErrorChain } from "../error";

// TODO(H): Improve operator field documentation/testing/code readability.

/** Field error codes. */
export enum EFieldError {
  AndFieldError,
  OrFieldError,
  NotFieldError,
  OptionalFieldError
}

/** Field error chain class. */
export class FieldError extends ErrorChain {
  public constructor(code: EFieldError, value?: any, cause?: Error) {
    super({ name: EFieldError[code], value }, cause);
  }
}

/** Field abstract base class. */
export abstract class Field<T, C = object> {
  /** Validate method takes string input and returns typed output. */
  public abstract validate(value?: string | object, context?: C): T | null;

  /** Format method takes typed input and returns string output. */
  public format(value: T, context?: C): string | object | null {
    return toString(value);
  }

  /** Return an optional instance of this field. */
  public optional(defaultValue?: T): OptionalField<T, C> {
    return new OptionalField<T, C>(this, defaultValue);
  }

  /** And operator chaining. */
  public and(...fields: Array<Field<T, C>>): Field<T, C> {
    return new AndField<T, C>(this, ...fields);
  }

  /** Or operator chaining. */
  public or(...fields: Array<Field<T, C>>): Field<T, C> {
    return new OrField<T, C>(this, ...fields);
  }

  /** Not operator chaining. */
  public not(...fields: Array<Field<T, C>>): Field<T, C> {
    return this.and(this, new NotField<T, C>(...fields));
  }
}

/** Field operator abstract base class. */
export abstract class OperatorField<T, C = object> extends Field<T, C> {
  /** Chained fields for use by operator methods. */
  protected readonly fields: Array<Field<T, C>>;

  public constructor(...fields: Array<Field<T, C>>) {
    super();
    this.fields = fields;
  }
}

/**
 * Optional field wrapper, if value is defined uses field in validation/formatting.
 * If value is undefined default or null value is returned.
 */
export class OptionalField<T, C = object> extends Field<T, C> {
  protected readonly formatDefault: string | object | null;

  public constructor(protected readonly field: Field<T, C>, protected readonly defaultValue?: T, context?: any) {
    super();
    this.formatDefault = this.format(defaultValue, context);
  }

  public validate(value?: string, context?: C): T | null {
    try {
      if (value == null) {
        if (this.formatDefault == null) {
          return null;
        }
        return this.field.validate(this.formatDefault, context);
      }
      return this.field.validate(value, context);
    } catch (error) {
      throw new FieldError(EFieldError.OptionalFieldError, value, error);
    }
  }

  public format(value?: T, context?: C): string | object | null {
    try {
      if (value == null) {
        if (this.defaultValue == null) {
          return null;
        }
        return this.field.format(this.defaultValue, context);
      }
      return this.field.format(value, context);
    } catch (error) {
      throw new FieldError(EFieldError.OptionalFieldError, value, error);
    }
  }
}

/** And field operator, all input fields used in validation/formatting. */
export class AndField<T, C = object> extends OperatorField<T, C> {
  public validate(value: string, context?: C): T {
    let validated: T | null;
    try {
      validated = this.fields.map((f) => f.validate(value, context)).reduce((p, c) => (p != null ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.AndFieldError, value, error);
    }
    if (validated == null) {
      throw new FieldError(EFieldError.AndFieldError, value);
    }
    return validated;
  }

  public format(value: T, context?: C): string | object {
    let formatted: string | object | null;
    try {
      formatted = this.fields.map((f) => f.format(value, context)).reduce((p, c) => (p != null ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.AndFieldError, value, error);
    }
    if (formatted == null) {
      throw new FieldError(EFieldError.AndFieldError, value);
    }
    return formatted;
  }
}

/** Or field operator, at least one input field used in validation/formatting. */
export class OrField<T, C = object> extends OperatorField<T, C> {
  public validate(value: string, context?: C): T {
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
        .reduce((p, c) => (p != null ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.OrFieldError, value, error);
    }
    if (validated == null) {
      throw new FieldError(EFieldError.OrFieldError);
    }
    return validated;
  }

  public format(value: T, context?: C): string | object {
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
        .reduce((p, c) => (p != null ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.OrFieldError, value, error);
    }
    if (formatted == null) {
      throw new FieldError(EFieldError.OrFieldError);
    }
    return formatted;
  }
}

/** Not field operator, all input fields expected to throw error/fail in validation/formatting. */
export class NotField<T, C = object> extends OperatorField<T, C> {
  public validate(value: string, context?: C): null {
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
        .reduce((p, c) => (p != null ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.NotFieldError, value, error);
    }
    if (validated != null) {
      throw new FieldError(EFieldError.NotFieldError, validated);
    }
    return validated;
  }

  public format(value: T, context?: C): null {
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
        .reduce((p, c) => (p != null ? p : c), null);
    } catch (error) {
      throw new FieldError(EFieldError.NotFieldError, value, error);
    }
    if (formatted != null) {
      throw new FieldError(EFieldError.NotFieldError, formatted);
    }
    return formatted;
  }
}
