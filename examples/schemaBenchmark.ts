// tslint:disable:no-console
import * as validate from "../lib/validate";

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

const booleanField = new validate.BooleanField();
const stringField = new validate.StringField();
const optionalBooleanField = new validate.OptionalField(booleanField);
const optionalStringField = new validate.OptionalField(stringField);

const dataSchema = validate.buildSchema({
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
  childSchema: validate.buildSchema({
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

for (let i = 0; i < 5; i++) {
  console.time("schemaTest");
  for (let j = 0; j < 10000; j++) {
    dataSchema.validate<IData>(inputData);
  }
  console.timeEnd("schemaTest");
}
