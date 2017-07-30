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
  [key: string]: ISchemaMap | Schema | Field<any>;
}

/** Schema map callback handlers. */
export interface ISchemaMapHandlers {
  isSchemaMap?: (map: ISchemaMap, key: string) => void;
  isSchema?: (schema: any, key: string) => void;
  isField?: (field: Field<any>, key: string) => void;
}

/** Schema static interface. */
export interface ISchemaConstructor {
  MAP: ISchemaMap;
  new(name: string): Schema;
  isSchema(value: any): boolean;
  map(map: ISchemaMap, handlers: ISchemaMapHandlers): void;
  validate<T extends ISchemaData>(data: any): T;
  format<T extends ISchemaData>(data: T): any;
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
   * Helper for iterating over schema fields.
   * TODO: Asterisk support for wildcard fields.
   */
  public static map(map: ISchemaMap, handlers: ISchemaMapHandlers): void {
    // For each key in schema map.
    Object.keys(map).map((key) => {
      const mapValue = map[key];

      if (Schema.isSchema(mapValue) && (handlers.isSchema != null)) {

        // Value is child schema.
        const schema: any = mapValue as any;
        handlers.isSchema(schema, key);

      } else if ((mapValue instanceof Field) && (handlers.isField != null)) {

        // Value is field class instance.
        const field: Field<any> = mapValue as any;
        handlers.isField(field, key);

      } else if ((typeof mapValue === "object") && (handlers.isSchemaMap != null)) {

        // Value is schema map object.
        const schemaMap: ISchemaMap = mapValue as any;
        handlers.isSchemaMap(schemaMap, key);

      } else {

        // Unknown value.
        throw new SchemaError(key);

      }
    });
  }

  /**
   * Validate input data, transform strings to typed values.
   * All static validation rules are applied, undefined data validation
   * callbacks must provide a default value, null or throw an error.
   * @param data Input data.
   */
  public static validate<T extends ISchemaData>(data: any = {}, _map = this.MAP): T {
    const validated: any = {};

    try {
      Schema.map(_map, {
        isSchemaMap: (map, key) => {
          // Make recursive call for internal data maps.
          // Only assign output if at least one field validated.
          const output = Schema.validate(data[key], map);
          if (Object.keys(output).length > 0) {
            validated[key] = output;
          }
        },
        isSchema: (schema, key) => {
          // Call static method of child schema.
          // Only assign output if at least one field validated.
          const output = schema.validate(data[key]);
          if (Object.keys(output).length > 0) {
            validated[key] = output;
          }
        },
        isField: (field, key) => {

          // Call validate method of field.
          // Only assign output if defined.
          const output = field.validate(data[key]);
          if (output != null) {
            validated[key] = output;
          }
        },
      });
    } catch (error) {
      throw new SchemaError(error);
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
      Schema.map(_map, {
        isSchemaMap: (map, key) => {
          // Make recursive call for internal data maps.
          const output = Schema.format(data[key], map);
          if (Object.keys(output).length > 0) {
            formatted[key] = output;
          }
        },
        isSchema: (schema, key) => {
          // Call static method if child schema.
          const output = schema.format(data[key]);
          if (Object.keys(output).length > 0) {
            formatted[key] = output;
          }
        },
        isField: (field, key) => {
          // Call format method of field.
          const output = field.format(data[key]);
          if (output != null) {
            formatted[key] = output;
          }
        },
      });
    } catch (error) {
      throw new SchemaError(error);
    }

    return formatted;
  }

}
