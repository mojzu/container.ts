import { Field } from "./Field";

/** Schema error class. */
export class SchemaError extends Error {
  // TODO: Improve SchemaError input arguments.
  public constructor(key: any) {
    const error: any = super(key);
    this.name = error.name = "SchemaError";
    this.stack = error.stack;
    this.message = error.message;
  }
}

export type SchemaTypes = ISchemaArray | ISchemaMap;
export type SchemaFields = SchemaTypes | Schema | Field<any>;

/** Schema array type, recursive type. */
export interface ISchemaArray {
  [key: number]: SchemaFields;
}

/** Schema map type, recursive type. */
export interface ISchemaMap {
  [key: string]: SchemaFields;
}

/** Schema mask type, recursive type. */
export interface ISchemaMask {
  [key: string]: ISchemaMask | boolean;
}

/** Schema map callback handlers. */
export interface ISchemaMapHandlers {
  isSchemaArray?: (array: ISchemaArray, key: number | string, mask?: ISchemaMask) => void;
  isSchemaMap?: (map: ISchemaMap, key: number | string, mask?: ISchemaMask) => void;
  isSchema?: (schema: ISchemaConstructor, key: number | string) => void;
  isField?: (field: Field<any>, key: number | string) => void;
}

/** Schema static interface. */
export interface ISchemaConstructor {
  SCHEMA: SchemaTypes;
  new(): Schema;
  isSchema(value: any): boolean;
  map(
    schema: SchemaTypes,
    mask?: ISchemaMask,
    dataKeys?: Array<number | string>,
    handlers?: ISchemaMapHandlers,
  ): void;
  validate<T>(data: any, mask?: ISchemaMask): T;
  format<T>(data: T, mask?: ISchemaMask): any;
}

/** Build schema class from input map. */
export function buildSchema(schema: SchemaTypes = {}): ISchemaConstructor {
  class NewSchema extends Schema {
    public static SCHEMA = schema;
  }
  return NewSchema;
}

export abstract class Schema {

  /** Schema array or map, override in child classes. */
  public static SCHEMA: SchemaTypes = {};

  /**
   * Returns true if value is a Schema class object.
   * Used to test for child schemas during validation/formatting.
   */
  public static isSchema(value: any): boolean {
    const isFunction = (typeof value === "function");
    const hasSchemaProperty = (value.SCHEMA != null);
    return (isFunction && hasSchemaProperty);
  }

  /**
   * Helper for iterating over schema fields.
   */
  public static map(
    schema: SchemaTypes,
    mask: ISchemaMask | null = null,
    dataKeys: Array<number | string> = [],
    handlers: ISchemaMapHandlers = {},
  ): void {
    const mapHandler = (value: any, key: number | string) => {
      // Handle masked fields if defined.
      let submask: ISchemaMask | undefined;

      if (mask != null) {
        if (!mask[key]) {
          // Field(s) are masked.
          return;
        } else if (typeof mask[key] === "object") {
          // Subfield mask argument.
          submask = mask[key] as any;
        }
      }

      if (Schema.isSchema(value) && (handlers.isSchema != null)) {

        // Value is child schema.
        const childSchema: any = value as any;
        handlers.isSchema(childSchema, key);

      } else if ((value instanceof Field) && (handlers.isField != null)) {

        // Value is field class instance.
        const field: Field<any> = value as any;
        handlers.isField(field, key);

      } else if (Array.isArray(value) && (handlers.isSchemaArray != null)) {

        // Value is a schema array object.
        const schemaArray: ISchemaArray = value as any;
        handlers.isSchemaArray(schemaArray, key, submask);

      } else if ((typeof value === "object") && (handlers.isSchemaMap != null)) {

        // Value is schema map object.
        const schemaMap: ISchemaMap = value as any;
        handlers.isSchemaMap(schemaMap, key, submask);

      } else {

        // Unknown value.
        throw new SchemaError(key);

      }
    };
    if (Array.isArray(schema)) {

      const schemaArray: SchemaFields[] = schema as any;
      if (schemaArray[0] === "*") {
        // Wildcard asterisk, map all data indexes to field.
        dataKeys.map((key) => {
          mapHandler(schemaArray[1], key);
        });
      } else {
        // Else for each value in schema array.
        schemaArray.map((value, index) => {
          mapHandler(value, index);
        });
      }

    } else {

      const schemaMap: ISchemaMap = schema as any;
      if (schemaMap["*"] != null) {
        // If wildcard asterisk is present, map all data keys to field.
        dataKeys.map((key) => {
          mapHandler(schemaMap["*"], key);
        });
      } else {
        // Else for each key in schema map.
        Object.keys(schemaMap).map((key) => {
          mapHandler(schemaMap[key], key);
        });
      }

    }
  }

  /**
   * Validate input data, transform strings to typed values.
   * All static validation rules are applied, undefined data validation
   * callbacks must provide a default value, null or throw an error.
   * @param data Input data.
   */
  public static validate<T>(data: any, mask?: ISchemaMask, _schema = this.SCHEMA): T {
    const validated: any = Array.isArray(_schema) ? [] : {};

    try {
      Schema.map(_schema, mask, Object.keys(data), {
        isSchemaArray: (array, key, submask) => {
          // Make recursive call for internal data arrays.
          // Only assign output if array has length.
          const output = Schema.validate<any[]>(data[key], submask, array);
          if (output.length > 0) {
            validated[key] = output;
          }
        },
        isSchemaMap: (map, key, submask) => {
          // Make recursive call for internal data maps.
          // Only assign output if at least one field validated.
          const output = Schema.validate(data[key], submask, map);
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
  public static format<T>(data: T, mask?: ISchemaMask, _schema = this.SCHEMA): any {
    const formatted: any = Array.isArray(_schema) ? [] : {};

    try {
      Schema.map(_schema, mask, Object.keys(data), {
        isSchemaArray: (array, key, submask) => {
          // Make recursive call for internal data arrays.
          const output = Schema.format<any[]>(data[key], submask, array);
          if (output.length > 0) {
            formatted[key] = output;
          }
        },
        isSchemaMap: (map, key, submask) => {
          // Make recursive call for internal data maps.
          const output = Schema.format(data[key], submask, map);
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
