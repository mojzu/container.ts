import { ValidateError } from "./Validate";
import { Field } from "./Field";

/** Schema error class. */
export class SchemaError extends Error {
  public constructor(key: string) {
    const error: any = super(key);
    this.name = error.name = "SchemaError";
    this.stack = error.stack;
    this.message = error.message;
  }
}

/** Generic schema data object. */
export interface ISchemaData extends Object {
  [key: string]: ISchemaData | any;
}

/** Schema map type, recursive type. */
export interface ISchemaMap {
  [key: string]: ISchemaMap | Schema | Field;
}

export abstract class Schema {

  /** Schema map, override in child classes. */
  public static MAP: ISchemaMap = {};

  /**
   * Returns true if value is a Schema class object.
   * Used to test for child schemas during validation/formatting.
   */
  public static isSchema(value: any): boolean {
    const isFunction = (typeof value === "function");
    const hasMapProperty = (value.MAP != null);
    return (isFunction && hasMapProperty);
  }

  /**
   * Validate input data, transform strings to typed values.
   * All static validation rules are applied, undefined data validation
   * callbacks must provide a default value or throw an error.
   * @param data Input data.
   */
  public static validate<T extends ISchemaData>(data: any = {}, _map = this.MAP): T {
    const validated: any = {};

    try {
      // For each key in schema map.
      Object.keys(_map).map((key) => {
        const mapValue = _map[key];

        if (Schema.isSchema(mapValue)) {

          // Value is child schema, call to static method.
          const schema: any = mapValue as any;
          validated[key] = schema.validate(data[key]);

        } else if (mapValue instanceof Field) {

          // Value is field class instance.
          const field: Field = mapValue as any;
          validated[key] = field.validate(data[key]);

        } else if (typeof mapValue === "object") {

          // Value is schema map object, recursive call.
          const map: ISchemaMap = mapValue as any;
          validated[key] = Schema.validate(data[key], map);

        } else {

          // Unknown value.
          throw new SchemaError(key);

        }
      });
    } catch (error) {
      throw new ValidateError(error.name);
    }

    return validated;
  }

  /**
   * Validate partial input data, transform object of strings to typed values.
   * Classes static validation rules are only applied where data is present.
   * @param data Partial input data.
   */
  public static validatePartial<T extends ISchemaData>(data: any = {}, _map = this.MAP): T {
    const validated: any = {};

    try {
      // For each key in data object.
      Object.keys(data).map((key) => {
        const mapValue = _map[key];

        if (mapValue != null) {
          // Schema map value exists.
          if (Schema.isSchema(mapValue)) {

            // Value is child schema, call to static method.
            const schema: any = mapValue as any;
            validated[key] = schema.validatePartial(data[key]);

          } else if (mapValue instanceof Field) {

            // Value is field class instance.
            const field: Field = mapValue as any;
            validated[key] = field.validate(data[key]);

          } else if (typeof mapValue === "object") {

            // Value is a schema map object, recursive call.
            const map: ISchemaMap = mapValue as any;
            validated[key] = Schema.validatePartial(data[key], map);

          } else {

            // Unknown value.
            throw new SchemaError(key);

          }
        }
      });
    } catch (error) {
      throw new ValidateError(error.name);
    }

    return validated;
  }

  /**
   * Format input data, transform typed values to object of strings for serialisation.
   * Classes static format rules are applied where data is available.
   * @param data Input data.
   */
  public static format<T extends ISchemaData>(data: T, _map = this.MAP): any {
    const formatted: any = {};

    try {
      // For each key in data object.
      Object.keys(data).map((key) => {
        const mapValue = _map[key];

        if (mapValue != null) {
          // Schema map value exists.
          if (Schema.isSchema(mapValue)) {

            // Value is a child schema, call to static method.
            const schema: any = mapValue as any;
            formatted[key] = schema.format(data[key]);

          } else if (mapValue instanceof Field) {

            // Value is field class instance.
            const field: Field = mapValue as any;
            formatted[key] = field.format(data[key]);

          } else if (typeof mapValue === "object") {

            // Value is a schema map object, recursive call.
            const map: ISchemaMap = mapValue as any;
            formatted[key] = Schema.format(data[key], map);

          } else {

            // Unknown value.
            throw new SchemaError(key);

          }
        }
      });
    } catch (error) {
      throw new ValidateError(error.name);
    }

    return formatted;
  }

}
