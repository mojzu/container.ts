import { BooleanField, OptionalField, StringField } from "../Field";
import { buildSchema } from "../Schema";

const booleanField = new BooleanField();
const stringField = new StringField();
const optionalBooleanField = new OptionalField(booleanField);
const optionalStringField = new OptionalField(stringField);

interface IData {
  booleanField: boolean;
  stringField: string;
  mapOuter: {
    booleanMapOuterField: boolean;
    stringMapOuterField: string;
    mapInner: {
      booleanMapInnerField: boolean;
      stringMapInnerField: string;
    },
  };
  mapOptional?: {
    booleanOptionalField?: boolean;
    stringOptionalField?: string;
  };
  childSchema: {
    booleanField: boolean;
    stringField: string;
  };
  arrayOuter: [
    boolean,
    string,
    [
      boolean,
      string
    ]
  ];
  wildcardMap?: {
    [key: string]: boolean;
  };
  any?: any;
  wildcardArray?: string[];
}

const dataSchema = buildSchema({
  // Fields.
  booleanField,
  stringField,
  // Mapped fields.
  mapOuter: {
    booleanMapOuterField: booleanField,
    stringMapOuterField: stringField,
    mapInner: {
      booleanMapInnerField: booleanField,
      stringMapInnerField: stringField,
    },
  },
  // Optional mapped fields.
  mapOptional: {
    booleanOptionalField: optionalBooleanField,
    stringOptionalField: optionalStringField,
  },
  // Child schemas.
  childSchema: buildSchema({
    booleanField,
    stringField,
  }),
  // Array of fields.
  arrayOuter: [
    booleanField,
    stringField,
    [
      booleanField,
      stringField,
    ],
  ],
  // Wildcard mapped fields.
  wildcardMap: {
    "*": booleanField,
  },
  // Wildcard any field.
  any: "*",
  // Wildcard array fields.
  wildcardArray: ["*", stringField],
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
        stringMapInnerField: "baz",
      },
    },
    mapOptional: {
      booleanOptionalField: "10",
    },
    childSchema: {
      booleanField: "1",
      stringField: "foo",
    },
    arrayOuter: [
      "true",
      "bar",
      [
        "false",
        "baz",
      ],
    ],
    wildcardMap: {
      one: "0",
      two: "1",
    },
    any: {
      one: 2,
      two: true,
    },
    wildcardArray: ["foo", "bar", "baz"],
  };
  const validated = dataSchema.validate<IData>(inputData);
  const formatted = dataSchema.format<IData>(validated);

  it("#Field", () => {
    expect(validated.booleanField).toEqual(true);
    expect(validated.stringField).toEqual("foo");
    expect(formatted.booleanField).toEqual("true");
    expect(formatted.stringField).toEqual("foo");
  });

  it("#Map", () => {
    expect(validated.mapOuter).toBeDefined();
    expect(validated.mapOuter.booleanMapOuterField).toEqual(false);
    expect(validated.mapOuter.stringMapOuterField).toEqual("bar");
    expect(validated.mapOuter.mapInner).toBeDefined();
    expect(validated.mapOuter.mapInner.booleanMapInnerField).toEqual(true);
    expect(validated.mapOuter.mapInner.stringMapInnerField).toEqual("baz");
  });

  it("#OptionalField", () => {
    expect(validated.mapOptional).toBeDefined();
    if (validated.mapOptional != null) {
      expect(validated.mapOptional.booleanOptionalField).toEqual(true);
      expect(validated.mapOptional.stringOptionalField).toBeUndefined();
    }
  });

  it("#ChildSchema", () => {
    expect(validated.childSchema).toBeDefined();
    expect(validated.childSchema.booleanField).toEqual(true);
    expect(validated.childSchema.stringField).toEqual("foo");
  });

  it("#Array", () => {
    expect(validated.arrayOuter).toBeDefined();
    expect(validated.arrayOuter.length).toEqual(3);
    expect(validated.arrayOuter[0]).toEqual(true);
    expect(validated.arrayOuter[1]).toEqual("bar");
    expect(validated.arrayOuter[2]).toBeDefined();
    expect(validated.arrayOuter[2].length).toEqual(2);
    expect(validated.arrayOuter[2][0]).toEqual(false);
    expect(validated.arrayOuter[2][1]).toEqual("baz");
  });

  it("#WildcardMap", () => {
    expect(validated.wildcardMap).toBeDefined();
    if (validated.wildcardMap != null) {
      expect(validated.wildcardMap.one).toEqual(false);
      expect(validated.wildcardMap.two).toEqual(true);
    }
    expect(formatted.wildcardMap).toBeDefined();
    expect(formatted.wildcardMap.one).toEqual("false");
    expect(formatted.wildcardMap.two).toEqual("true");
  });

  it("#Any", () => {
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

  it("#WildcardArray", () => {
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

  it("#Mask", () => {
    const inputMask = {
      booleanField: true,
      mapOuter: {
        booleanMapOuterField: true,
      },
      childSchema: true,
    };
    const masked = dataSchema.validate<IData>(inputData, inputMask);
    expect(masked.booleanField).toEqual(true);
    expect(masked.stringField).toBeUndefined();
    expect(masked.mapOuter).toBeDefined();
    expect(masked.mapOuter.booleanMapOuterField).toEqual(false);
    expect(masked.mapOuter.stringMapOuterField).toBeUndefined();
    expect(masked.mapOuter.mapInner).toBeUndefined();
    expect(masked.mapOptional).toBeUndefined();
    expect(masked.childSchema).toBeDefined();
    expect(masked.childSchema.booleanField).toEqual(true);
    expect(masked.childSchema.stringField).toEqual("foo");
    expect(masked.arrayOuter).toBeUndefined();
    expect(masked.wildcardMap).toBeUndefined();
    expect(masked.any).toBeUndefined();
    expect(masked.wildcardArray).toBeUndefined();
  });

});
