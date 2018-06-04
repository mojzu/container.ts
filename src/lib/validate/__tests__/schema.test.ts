import { ErrorChain } from "../../error";
import { Schema, SchemaField } from "../schema";
import { BooleanField, StringField } from "../validator";

const booleanField = new BooleanField();
const stringField = new StringField();
const optionalBooleanField = booleanField.optional();
const optionalStringField = stringField.optional();

interface IData {
  booleanField: boolean;
  stringField: string;
  mapOuter: {
    booleanMapOuterField: boolean;
    stringMapOuterField: string;
    mapInner: {
      booleanMapInnerField: boolean;
      stringMapInnerField: string;
    };
  };
  mapOptional?: {
    booleanOptionalField?: boolean;
    stringOptionalField?: string;
  };
  schemaField: {
    booleanField: boolean;
    stringField: string;
  };
  arrayOuter: [boolean, string, [boolean, string]];
  wildcardMap?: {
    [key: string]: boolean;
  };
  any?: any;
  wildcardArray?: string[];
}

const dataSchema = new Schema<IData>({
  // Fields.
  booleanField,
  stringField,
  // Mapped fields.
  mapOuter: {
    booleanMapOuterField: booleanField,
    stringMapOuterField: stringField,
    mapInner: {
      booleanMapInnerField: booleanField,
      stringMapInnerField: stringField
    }
  },
  // Optional mapped fields.
  mapOptional: {
    booleanOptionalField: optionalBooleanField,
    stringOptionalField: optionalStringField
  },
  // Schema fields.
  schemaField: new SchemaField({
    booleanField,
    stringField
  }),
  // Array of fields.
  arrayOuter: [booleanField, stringField, [booleanField, stringField]],
  // Wildcard mapped fields.
  wildcardMap: {
    "*": booleanField
  },
  // Wildcard any field.
  any: "*",
  // Wildcard array fields.
  wildcardArray: ["*", stringField]
});

describe("Schema", () => {
  const inputData = {
    booleanField: "1",
    stringField: "foo",
    mapOuter: {
      booleanMapOuterField: "false",
      stringMapOuterField: "bar",
      mapInner: {
        booleanMapInnerField: "1",
        stringMapInnerField: "baz"
      }
    },
    mapOptional: {
      booleanOptionalField: "10"
    },
    schemaField: {
      booleanField: "1",
      stringField: "foo"
    },
    arrayOuter: ["true", "bar", ["false", "baz"]],
    wildcardMap: {
      one: "0",
      two: "1"
    },
    any: {
      one: 2,
      two: true
    },
    wildcardArray: ["foo", "bar", "baz"]
  };
  const validated = dataSchema.validate(inputData);
  const formatted = dataSchema.format(validated) as any;

  it("fields have expected values", () => {
    expect(validated.booleanField).toEqual(true);
    expect(validated.stringField).toEqual("foo");
    expect(formatted.booleanField).toEqual("true");
    expect(formatted.stringField).toEqual("foo");
  });

  it("map fields have expected values", () => {
    expect(validated.mapOuter).toBeDefined();
    expect(validated.mapOuter.booleanMapOuterField).toEqual(false);
    expect(validated.mapOuter.stringMapOuterField).toEqual("bar");
    expect(validated.mapOuter.mapInner).toBeDefined();
    expect(validated.mapOuter.mapInner.booleanMapInnerField).toEqual(true);
    expect(validated.mapOuter.mapInner.stringMapInnerField).toEqual("baz");
  });

  it("optional fields may be undefined", () => {
    expect(validated.mapOptional).toBeDefined();
    if (validated.mapOptional != null) {
      expect(validated.mapOptional.booleanOptionalField).toEqual(true);
      expect(validated.mapOptional.stringOptionalField).toBeUndefined();
    }
  });

  it("schema fields have expected values", () => {
    expect(validated.schemaField).toBeDefined();
    expect(validated.schemaField.booleanField).toEqual(true);
    expect(validated.schemaField.stringField).toEqual("foo");
  });

  it("array fields have expected values", () => {
    expect(validated.arrayOuter).toBeDefined();
    expect(validated.arrayOuter.length).toEqual(3);
    expect(validated.arrayOuter[0]).toEqual(true);
    expect(validated.arrayOuter[1]).toEqual("bar");
    expect(validated.arrayOuter[2]).toBeDefined();
    expect(validated.arrayOuter[2].length).toEqual(2);
    expect(validated.arrayOuter[2][0]).toEqual(false);
    expect(validated.arrayOuter[2][1]).toEqual("baz");
  });

  it("wildcard map has expected values", () => {
    expect(validated.wildcardMap).toBeDefined();
    if (validated.wildcardMap != null) {
      expect(validated.wildcardMap.one).toEqual(false);
      expect(validated.wildcardMap.two).toEqual(true);
    }
    expect(formatted.wildcardMap).toBeDefined();
    expect(formatted.wildcardMap.one).toEqual("false");
    expect(formatted.wildcardMap.two).toEqual("true");
  });

  it("wildcard any has expected values", () => {
    expect(validated.any).toBeDefined();
    if (validated.any != null) {
      expect(validated.any.one).toEqual(2);
      expect(validated.any.two).toEqual(true);
    }
    // Wildcard any fields have no formatting rules.
    expect(formatted.any).toBeDefined();
    expect(formatted.any.one).toEqual(2);
    expect(formatted.any.two).toEqual(true);
  });

  it("wildcard array has expected values", () => {
    expect(validated.wildcardArray).toBeDefined();
    if (validated.wildcardArray != null) {
      expect(validated.wildcardArray.length).toEqual(3);
      expect(validated.wildcardArray[0]).toEqual("foo");
      expect(validated.wildcardArray[1]).toEqual("bar");
      expect(validated.wildcardArray[2]).toEqual("baz");
    }
    expect(formatted.wildcardArray).toBeDefined();
    expect(formatted.wildcardArray.length).toEqual(3);
    expect(formatted.wildcardArray[0]).toEqual("foo");
    expect(formatted.wildcardArray[1]).toEqual("bar");
    expect(formatted.wildcardArray[2]).toEqual("baz");
  });

  it("validation with mask returns expected values", () => {
    const inputMask = {
      booleanField: true,
      mapOuter: {
        booleanMapOuterField: true
      },
      schemaField: true
    };
    const masked = dataSchema.validate(inputData, inputMask);
    expect(masked.booleanField).toEqual(true);
    expect(masked.stringField).toBeUndefined();
    expect(masked.mapOuter).toBeDefined();
    expect(masked.mapOuter.booleanMapOuterField).toEqual(false);
    expect(masked.mapOuter.stringMapOuterField).toBeUndefined();
    expect(masked.mapOuter.mapInner).toBeUndefined();
    expect(masked.mapOptional).toBeUndefined();
    expect(masked.schemaField).toBeDefined();
    expect(masked.schemaField.booleanField).toEqual(true);
    expect(masked.schemaField.stringField).toEqual("foo");
    expect(masked.arrayOuter).toBeUndefined();
    expect(masked.wildcardMap).toBeUndefined();
    expect(masked.any).toBeUndefined();
    expect(masked.wildcardArray).toBeUndefined();
  });

  it("extend method works as expected", () => {
    const extendedSchema = dataSchema.extend({
      booleanField: stringField
    });
    const data = extendedSchema.validate(inputData, { booleanField: true });
    expect(typeof data.booleanField).toEqual("string");
  });

  it("extend can be passed Schema instances and definitions", () => {
    const fooSchema = new Schema({ foo: booleanField });
    const barSchema = new Schema({ bar: booleanField });
    const extendedSchema = fooSchema.extend<any>(barSchema, {
      baz: booleanField
    });
    const validateData = extendedSchema.validate({ foo: "true", bar: "false", baz: "0" });
    expect(validateData.foo).toEqual(true);
    expect(validateData.bar).toEqual(false);
    expect(validateData.baz).toEqual(false);
  });

  it("schema error chain value is key path", (done) => {
    const invalidData = {
      mapOuter: {
        mapInner: {
          stringMapInnerField: 42
        }
      }
    };
    try {
      dataSchema.validate(invalidData, { mapOuter: { mapInner: { stringMapInnerField: true } } });
      done.fail();
    } catch (error) {
      expect(ErrorChain.isErrorChain(error)).toEqual(true);
      expect(ErrorChain.errorName(error)).toEqual("SchemaValueError.IsStringError.TypeError");
      expect(error.value).toEqual(".mapOuter.mapInner.stringMapInnerField");
      done();
    }
  });

  it("undefined data for array schema returns empty array", () => {
    const schema = new Schema(["*", booleanField]);
    const validateData = schema.validate(undefined as any);
    expect(validateData).toEqual([]);
    const formatData = schema.format(undefined as any);
    expect(formatData).toEqual([]);
  });
});
