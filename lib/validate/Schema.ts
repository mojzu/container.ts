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
  isSchemaArray?: (i: any, o: any, array: ISchemaArray, k: number | string, m?: ISchemaMask, kr?: string) => void;
  isSchemaMap?: (i: any, o: any, map: ISchemaMap, k: number | string, m?: ISchemaMask, kr?: string) => void;
  isSchema?: (i: any, o: any, schema: ISchemaConstructor, k: number | string, m?: ISchemaMask, kr?: string) => void;
  isField?: (i: any, o: any, field: Field<any>, k: number | string) => void;
}

/** Schema static interface. */
export interface ISchemaConstructor {
  SCHEMA: ISchemaTypes;
  new(): Schema;
  isSchema(value: any): boolean;
  map(
    inp: any, out: any,
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
    public static readonly SCHEMA = schema;
  }
  return NewSchema;
}

export abstract class Schema {

  /** Schema array or map, override in child classes. */
  public static readonly SCHEMA: ISchemaTypes = {};

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
    inp: any, out: any,
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
          Schema.mapHandler(inp, out, mask, keyRoot, handlers, schemaArray[1], key);
        });
      } else {
        // Else for each value in schema array.
        schemaArray.map((value, index) => {
          Schema.mapHandler(inp, out, mask, keyRoot, handlers, value, index);
        });
      }

    } else {

      const schemaMap: ISchemaMap = schema as any;
      if (schemaMap["*"] != null) {
        // If wildcard asterisk is present, map all data keys to field.
        dataKeys.map((key) => {
          Schema.mapHandler(inp, out, mask, keyRoot, handlers, schemaMap["*"], key);
        });
      } else {
        // Else for each key in schema map.
        Object.keys(schemaMap).map((key) => {
          Schema.mapHandler(inp, out, mask, keyRoot, handlers, schemaMap[key], key);
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
    Schema.map(data, validated, _schema, mask, Object.keys(data || {}), _keyRoot, Schema.validateMapHandlers);
    return validated;
  }

  /**
   * Format input data, transform typed values to object of strings for serialisation.
   * Classes static format rules are applied where data is available.
   * @param data Input data.
   */
  public static format<T>(data: T, mask?: ISchemaMask, _keyRoot = "", _schema = this.SCHEMA): any {
    const formatted: any = Array.isArray(_schema) ? [] : {};
    Schema.map(data, formatted, _schema, mask, Object.keys(data || {}), _keyRoot, Schema.formatMapHandlers);
    return formatted;
  }

  protected static readonly validateMapHandlers: ISchemaMapHandlers = {
    isSchemaArray: (inp, out, array, key, submask, keyRoot) => {
      // Make recursive call for internal data arrays.
      // Only assign output if array has length.
      const output = Schema.validate<any[]>(inp[key], submask, keyRoot, array);
      if (output.length > 0) {
        out[key] = output;
      }
    },
    isSchemaMap: (inp, out, map, key, submask, keyRoot) => {
      // Make recursive call for internal data maps.
      // Only assign output if at least one field validated.
      const output = Schema.validate(inp[key], submask, keyRoot, map);
      if (Object.keys(output).length > 0) {
        out[key] = output;
      }
    },
    isSchema: (inp, out, schema, key, submask, keyRoot) => {
      // Call static method of child schema.
      // Only assign output if at least one field validated.
      const output = schema.validate(inp[key], submask, keyRoot);
      if (Object.keys(output).length > 0) {
        out[key] = output;
      }
    },
    isField: (inp, out, field, key) => {
      // Call validate method of field.
      // Only assign output if defined.
      const output = field.validate(inp[key]);
      if (output != null) {
        out[key] = output;
      }
    },
  };

  protected static readonly formatMapHandlers: ISchemaMapHandlers = {
    isSchemaArray: (inp, out, array, key, submask, keyRoot) => {
      // Make recursive call for internal data arrays.
      const output = Schema.format<any[]>(inp[key], submask, keyRoot, array);
      if (output.length > 0) {
        out[key] = output;
      }
    },
    isSchemaMap: (inp, out, map, key, submask, keyRoot) => {
      // Make recursive call for internal data maps.
      const output = Schema.format(inp[key], submask, keyRoot, map);
      if (Object.keys(output).length > 0) {
        out[key] = output;
      }
    },
    isSchema: (inp, out, schema, key, submask, keyRoot) => {
      // Call static method if child schema.
      const output = schema.format(inp[key], submask, keyRoot);
      if (Object.keys(output).length > 0) {
        out[key] = output;
      }
    },
    isField: (inp, out, field, key) => {
      // Call format method of field.
      const output = field.format(inp[key]);
      if (output != null) {
        out[key] = output;
      }
    },
  };

  /** Internal schema map handler. */
  protected static mapHandler(
    inp: any, out: any,
    mask: ISchemaMask | null,
    keyRoot: string,
    handlers: ISchemaMapHandlers,
    value: any,
    key: number | string,
  ) {
    // Expand key root.
    const subkeyRoot = `${keyRoot}.${key}`;

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

    try {
      if (Schema.isSchema(value) && (!!handlers.isSchema)) {

        // Value is child schema.
        const childSchema: any = value;
        handlers.isSchema(inp, out, childSchema, key, submask, subkeyRoot);

      } else if ((value instanceof Field) && (!!handlers.isField)) {

        // Value is field class instance.
        const field: Field<any> = value as any;
        handlers.isField(inp, out, field, key);

      } else if (Array.isArray(value) && (!!handlers.isSchemaArray)) {

        // Value is a schema array object.
        const schemaArray: ISchemaArray = value as any;
        handlers.isSchemaArray(inp, out, schemaArray, key, submask, subkeyRoot);

      } else if ((typeof value === "object") && (!!handlers.isSchemaMap)) {

        // Value is schema map object.
        const schemaMap: ISchemaMap = value as any;
        handlers.isSchemaMap(inp, out, schemaMap, key, submask, subkeyRoot);

      } else {

        // Unknown schema field value.
        throw new ValidateError(EValidateErrorCode.InvalidSchema, value);

      }
    } catch (error) {

      // Schema error wrapper.
      if (error instanceof SchemaError) {
        throw error;
      } else {
        throw new SchemaError(subkeyRoot, error);
      }

    }
  }

}
