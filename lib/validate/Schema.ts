import { ErrorChain } from "../error";
import { EValidateErrorCode, ValidateError } from "./Validate";
import { Field } from "./Field";

/** Schema error class. */
export class SchemaError extends ErrorChain {
  public constructor(keys: string, cause?: any) {
    super({ name: "SchemaError", value: keys }, cause);
  }
}

export type ISchemaTypes = ISchemaArray | ISchemaMap;
export type ISchemaFields = ISchemaTypes | Schema | Field<any>;

/** Schema array type, recursive type. */
export interface ISchemaArray {
  [key: number]: ISchemaFields;
}

/** Schema map type, recursive type. */
export interface ISchemaMap {
  [key: string]: ISchemaFields;
}

/** Schema mask type, recursive type. */
export interface ISchemaMask {
  [key: string]: ISchemaMask | boolean;
}

/** Schema map callback handlers. */
export interface ISchemaMapHandlers {
  isSchemaArray?: (array: ISchemaArray, key: number | string, mask?: ISchemaMask, keyRoot?: string) => void;
  isSchemaMap?: (map: ISchemaMap, key: number | string, mask?: ISchemaMask, keyRoot?: string) => void;
  isSchema?: (schema: ISchemaConstructor, key: number | string, mask?: ISchemaMask, keyRoot?: string) => void;
  isField?: (field: Field<any>, key: number | string) => void;
}

/** Schema static interface. */
export interface ISchemaConstructor {
  SCHEMA: ISchemaTypes;
  new(): Schema;
  isSchema(value: any): boolean;
  map(
    schema: ISchemaTypes,
    mask?: ISchemaMask,
    dataKeys?: Array<number | string>,
    keyRoot?: string,
    handlers?: ISchemaMapHandlers,
  ): void;
  validate<T>(data: any, mask?: ISchemaMask, keyRoot?: string): T;
  format<T>(data: T, mask?: ISchemaMask, keyRoot?: string): any;
}

/** Build schema class from input map. */
export function buildSchema(schema: ISchemaTypes = {}): ISchemaConstructor {
  class NewSchema extends Schema {
    public static SCHEMA = schema;
  }
  return NewSchema;
}

interface IMapHandler {
  mask: ISchemaMask | null;
  keyRoot: string;
  handlers: ISchemaMapHandlers;
  value: any;
  key: number | string;
}

const mapHandler = (opts: IMapHandler) => {
  // Expand key root.
  const subkeyRoot = `${opts.keyRoot}.${opts.key}`;

  // Handle masked fields if defined.
  let submask: ISchemaMask | undefined;
  if (opts.mask != null) {
    if (!opts.mask[opts.key]) {
      // Field(s) are masked.
      return;
    } else if (typeof opts.mask[opts.key] === "object") {
      // Subfield mask argument.
      submask = opts.mask[opts.key] as any;
    }
  }

  try {
    if (Schema.isSchema(opts.value) && (opts.handlers.isSchema != null)) {

      // Value is child schema.
      const childSchema: any = opts.value;
      opts.handlers.isSchema(childSchema, opts.key, submask, subkeyRoot);

    } else if ((opts.value instanceof Field) && (opts.handlers.isField != null)) {

      // Value is field class instance.
      const field: Field<any> = opts.value as any;
      opts.handlers.isField(field, opts.key);

    } else if (Array.isArray(opts.value) && (opts.handlers.isSchemaArray != null)) {

      // Value is a schema array object.
      const schemaArray: ISchemaArray = opts.value as any;
      opts.handlers.isSchemaArray(schemaArray, opts.key, submask, subkeyRoot);

    } else if ((typeof opts.value === "object") && (opts.handlers.isSchemaMap != null)) {

      // Value is schema map object.
      const schemaMap: ISchemaMap = opts.value as any;
      opts.handlers.isSchemaMap(schemaMap, opts.key, submask, subkeyRoot);

    } else {

      // Unknown schema field value.
      throw new ValidateError(EValidateErrorCode.InvalidSchema, opts.value);

    }
  } catch (error) {

    // Schema error wrapper.
    if (error instanceof SchemaError) {
      throw error;
    } else {
      throw new SchemaError(subkeyRoot, error);
    }

  }
};

export abstract class Schema {

  /** Schema array or map, override in child classes. */
  public static SCHEMA: ISchemaTypes = {};

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
    schema: ISchemaTypes,
    mask: ISchemaMask | null = null,
    dataKeys: Array<number | string> = [],
    keyRoot = "",
    handlers: ISchemaMapHandlers = {},
  ): void {
    if (Array.isArray(schema)) {

      const schemaArray: ISchemaFields[] = schema as any;
      if (schemaArray[0] === "*") {
        // Wildcard asterisk, map all data indexes to field.
        dataKeys.map((key) => {
          mapHandler({ mask, keyRoot, handlers, value: schemaArray[1], key});
        });
      } else {
        // Else for each value in schema array.
        schemaArray.map((value, index) => {
          mapHandler({ mask, keyRoot, handlers, value, key: index});
        });
      }

    } else {

      const schemaMap: ISchemaMap = schema as any;
      if (schemaMap["*"] != null) {
        // If wildcard asterisk is present, map all data keys to field.
        dataKeys.map((key) => {
          mapHandler({ mask, keyRoot, handlers, value: schemaMap["*"], key });
        });
      } else {
        // Else for each key in schema map.
        Object.keys(schemaMap).map((key) => {
          mapHandler({ mask, keyRoot, handlers, value: schemaMap[key], key });
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
  public static validate<T>(data: any, mask?: ISchemaMask, _keyRoot = "", _schema = this.SCHEMA): T {
    const validated: any = Array.isArray(_schema) ? [] : {};

    Schema.map(_schema, mask, Object.keys(data || {}), _keyRoot, {
      isSchemaArray: (array, key, submask, keyRoot) => {
        // Make recursive call for internal data arrays.
        // Only assign output if array has length.
        const output = Schema.validate<any[]>(data[key], submask, keyRoot, array);
        if (output.length > 0) {
          validated[key] = output;
        }
      },
      isSchemaMap: (map, key, submask, keyRoot) => {
        // Make recursive call for internal data maps.
        // Only assign output if at least one field validated.
        const output = Schema.validate(data[key], submask, keyRoot, map);
        if (Object.keys(output).length > 0) {
          validated[key] = output;
        }
      },
      isSchema: (schema, key, submask, keyRoot) => {
        // Call static method of child schema.
        // Only assign output if at least one field validated.
        const output = schema.validate(data[key], submask, keyRoot);
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

    return validated;
  }

  /**
   * Format input data, transform typed values to object of strings for serialisation.
   * Classes static format rules are applied where data is available.
   * @param data Input data.
   */
  public static format<T>(data: T, mask?: ISchemaMask, _keyRoot = "", _schema = this.SCHEMA): any {
    const formatted: any = Array.isArray(_schema) ? [] : {};

    Schema.map(_schema, mask, Object.keys(data || {}), _keyRoot, {
      isSchemaArray: (array, key, submask, keyRoot) => {
        // Make recursive call for internal data arrays.
        const output = Schema.format<any[]>(data[key], submask, keyRoot, array);
        if (output.length > 0) {
          formatted[key] = output;
        }
      },
      isSchemaMap: (map, key, submask, keyRoot) => {
        // Make recursive call for internal data maps.
        const output = Schema.format(data[key], submask, keyRoot, map);
        if (Object.keys(output).length > 0) {
          formatted[key] = output;
        }
      },
      isSchema: (schema, key, submask, keyRoot) => {
        // Call static method if child schema.
        const output = schema.format(data[key], submask, keyRoot);
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

    return formatted;
  }

}
