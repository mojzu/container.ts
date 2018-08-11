import { assign, get, isArray, isObject, keys } from "lodash";
import { ErrorChain } from "../error";
import { Field } from "./field";

/** Schema error codes. */
export enum ESchemaError {
  Field,
  Value
}

/** Schema error class. */
export class SchemaError extends ErrorChain {
  protected readonly isSchemaError = true;
  public constructor(code: ESchemaError, cause?: Error, context?: object) {
    super({ name: "SchemaError", value: { code, ...context } }, cause);
  }
}

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

/** Schema arrays or maps may contain field instances or internal arrays/maps. */
export type ISchemaFields = ISchema | Field<any>;

/** Schema root definition must be an array or map. */
export type ISchema = ISchemaArray | ISchemaMap;

/** Schema map handlers. */
export interface ISchemaMapHandlers {
  isSchemaArray: (
    i: any,
    o: any,
    schema: Schema<any>,
    array: ISchemaArray,
    k: number | string,
    m?: ISchemaMask,
    pk?: string
  ) => void;
  isSchemaMap: (
    i: any,
    o: any,
    schema: Schema<any>,
    map: ISchemaMap,
    k: number | string,
    m?: ISchemaMask,
    pk?: string
  ) => void;
  isField: (i: any, o: any, field: Field<any>, k: number | string, m?: ISchemaMask, pk?: string) => void;
}

export class Schema<T = object> {
  public static mapValidateHandlers: ISchemaMapHandlers = {
    isSchemaArray: (input, output, schema, array, key, mask, parentKey) => {
      // Make recursive call for internal data arrays.
      output[key] = schema.validate(input[key], mask, parentKey, array);
    },
    isSchemaMap: (input, output, schema, map, key, mask, parentKey) => {
      // Make recursive call for internal data maps.
      output[key] = schema.validate(input[key], mask, parentKey, map);
    },
    isField: (input, output, field, key, mask, parentKey) => {
      // Call validate method of field, only assign output if defined.
      const validated = field.validate(input[key], { mask, parentKey });
      if (validated != null) {
        output[key] = validated;
      }
    }
  };

  public static mapFormatHandlers: ISchemaMapHandlers = {
    isSchemaArray: (input, output, schema, array, key, mask, parentKey) => {
      // Make recursive call for internal data arrays.
      output[key] = schema.format(input[key], mask, parentKey, array);
    },
    isSchemaMap: (input, output, schema, map, key, mask, parentKey) => {
      // Make recursive call for internal data maps.
      output[key] = schema.format(input[key], mask, parentKey, map);
    },
    isField: (input, output, field, key, mask, keyRoot) => {
      // Call format method of field.
      const formatted = field.format(input[key], { mask, keyRoot });
      if (formatted != null) {
        output[key] = formatted;
      }
    }
  };

  /** Returns true if input instance of Schema. */
  public static isSchema<X>(schema: any): schema is Schema<X> {
    const instanceOf = schema instanceof Schema;
    const hasProperty = !!schema.isSchema;
    return instanceOf || hasProperty;
  }

  /** Returns true if input instance of SchemaError. */
  public static isSchemaError(error: any): error is SchemaError {
    const instanceOf = error instanceof SchemaError;
    const hasProperty = !!error.isSchemaError;
    return instanceOf || hasProperty;
  }

  /**
   * Construct new schema by merging existing schemas.
   * Accepts schema definition objects or existing Schema class instances.
   */
  public static extend<E>(...schemas: Array<Schema<any> | ISchema>): Schema<E> {
    const schemaDefinitions: ISchema[] = schemas.map((s) => {
      return Schema.isSchema(s) ? s.schema : (s as ISchema);
    });
    return new Schema(assign({}, ...schemaDefinitions));
  }

  /** Used for isSchema static method. */
  protected readonly isSchema = true;

  public constructor(public readonly schema: ISchema) {}

  /**
   * Construct new schema using this as a base.
   * Accepts schema definition objects or existing Schema class instances.
   */
  public extend<K extends T>(...schemas: Array<Schema<any> | ISchema>): Schema<K> {
    return Schema.extend<K>(this.schema, ...schemas);
  }

  /** Validate input data, transform strings to typed values. */
  public validate(data: object, mask?: ISchemaMask, parentKey = "", schema = this.schema): T {
    const validated = isArray(schema) ? [] : {};
    this.map(data, validated, schema, Schema.mapValidateHandlers, mask, parentKey);
    return validated as T;
  }

  /** Format input data, transform typed values to object of strings for serialisation. */
  public format(data: T, mask?: ISchemaMask, parentKey = "", schema = this.schema): object {
    const formatted = isArray(schema) ? [] : {};
    this.map(data, formatted, schema, Schema.mapFormatHandlers, mask, parentKey);
    return formatted as object;
  }

  /** Helper for iterating over schema fields. */
  public map(
    input: any,
    output: any,
    schema: ISchema,
    handlers: ISchemaMapHandlers,
    mask?: ISchemaMask,
    parentKey = ""
  ): void {
    if (isArray(schema)) {
      const schemaArray = schema as ISchemaFields[];
      if (schemaArray[0] === "*") {
        // Wildcard asterisk, map all data indexes to field.
        keys(input).map((key) => this.mapHandler(input, output, mask, parentKey, handlers, schemaArray[1], key));
      } else {
        // Else for each value in schema array.
        schemaArray.map((value, index) => this.mapHandler(input, output, mask, parentKey, handlers, value, index));
      }
    } else {
      const schemaMap = schema as ISchemaMap;
      if (schemaMap["*"] != null) {
        // If wildcard asterisk is present, map all data keys to field.
        keys(input).map((key) => this.mapHandler(input, output, mask, parentKey, handlers, schemaMap["*"], key));
      } else {
        // Else for each key in schema map.
        keys(schemaMap).map((key) => this.mapHandler(input, output, mask, parentKey, handlers, schemaMap[key], key));
      }
    }
  }

  protected mapHandler(
    input: any,
    output: any,
    mask: ISchemaMask | undefined,
    parentKey: string,
    handlers: ISchemaMapHandlers,
    value: any,
    key: number | string
  ): void {
    // Key path construction for error messages.
    const path = `${parentKey}.${key}`;

    // Handle masked fields if defined.
    let mapMask: ISchemaMask | undefined;
    if (mask != null) {
      if (!get(mask, key, false)) {
        // Field(s) are masked.
        return;
      } else if (isObject(mask[key])) {
        // Map mask argument.
        mapMask = mask[key] as ISchemaMask;
      }
    }

    try {
      if (value instanceof Field) {
        // Value is field class instance.
        const field = value as Field<any>;
        handlers.isField(input, output, field, key, mapMask, path);
      } else if (isArray(value)) {
        // Value is a schema array object.
        const schemaArray = value as ISchemaArray;
        handlers.isSchemaArray(input, output, this, schemaArray, key, mapMask, path);
      } else if (isObject(value)) {
        // Value is schema map object.
        const schemaMap = value as ISchemaMap;
        handlers.isSchemaMap(input, output, this, schemaMap, key, mapMask, path);
      } else if (value === "*") {
        // Wildcard asterisk, accept all data.
        output[key] = input[key];
      } else {
        // Invalid schema field value.
        throw new SchemaError(ESchemaError.Value, value, { path });
      }
    } catch (error) {
      // Schema error wrapper.
      if (Schema.isSchemaError(error)) {
        throw error;
      } else {
        throw new SchemaError(ESchemaError.Field, error, { path });
      }
    }
  }
}

export interface ISchemaFieldContext {
  mask?: ISchemaMask;
  parentKey?: string;
}

export class SchemaField<T = object> extends Field<T> {
  protected readonly schema: Schema<T>;

  public constructor(instanceOrSchema: Schema<T> | ISchema) {
    super();
    if (Schema.isSchema<T>(instanceOrSchema)) {
      this.schema = instanceOrSchema;
    } else {
      this.schema = new Schema(instanceOrSchema as ISchema);
    }
  }

  public validate(value: object, context: ISchemaFieldContext = {}): T {
    return this.schema.validate(value, context.mask, context.parentKey);
  }

  public format(value: T, context: ISchemaFieldContext): object {
    return this.schema.format(value, context.mask, context.parentKey);
  }
}
