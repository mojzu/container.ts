/// <reference types="jasmine" />
import { Schema, ISchemaMap } from "./Schema";
import { BooleanField } from "./Field";

const booleanField = new BooleanField();
const booleanStrictField = new BooleanField({ strict: true });

interface IBooleanChildData {
  value1: boolean;
}

interface IBooleanData {
  value1: boolean;
  value2: boolean;
  group1: {
    value1: boolean;
  };
  child1: IBooleanChildData;
}

class BooleanChildDataSchema extends Schema {
  public static MAP: ISchemaMap = {
    value1: booleanStrictField,
  };
}

class BooleanDataSchema extends Schema {
  public static MAP: ISchemaMap = {
    value1: booleanField,
    value2: booleanStrictField,
    group1: {
      value1: booleanField,
    },
    child1: BooleanChildDataSchema,
  };
}

describe("Schema", () => {

  const booleanInputData = {
    value1: "foo",
    value2: "false",
    group1: {
      value1: "",
    },
    child1: {
      value1: "1",
    },
  };
  const booleanPartialInputData = {
    value1: "0",
  };
  const booleanData: IBooleanData = {
    value1: true,
    value2: false,
    group1: {
      value1: false,
    },
    child1: {
      value1: true,
    },
  };

  it("Boolean input data is validated", () => {
    const data = BooleanDataSchema.validate<IBooleanData>(booleanInputData);
    expect(data.value1).toEqual(true);
    expect(data.value2).toEqual(false);
    expect(data.group1).toBeDefined();
    expect(data.group1.value1).toEqual(false);
    expect(data.child1).toBeDefined();
    expect(data.child1.value1).toEqual(true);
  });

  it("Boolean partial input data is validated", () => {
    const data = BooleanDataSchema.validatePartial<IBooleanData>(booleanPartialInputData);
    expect(data.value1).toEqual(false);
    expect(data.value2).toBeUndefined();
    expect(data.group1).toBeUndefined();
    expect(data.child1).toBeUndefined();
  });

  it("Boolean data is formatted", () => {
    const formatted = BooleanDataSchema.format<IBooleanData>(booleanData);
    expect(formatted.value1).toEqual("true");
    expect(formatted.value2).toEqual("false");
    expect(formatted.group1).toBeDefined();
    expect(formatted.group1.value1).toEqual("false");
    expect(formatted.child1).toBeDefined();
    expect(formatted.child1.value1).toEqual("true");
  });

});
