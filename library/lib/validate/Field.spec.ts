/// <reference types="jasmine" />
import { ArrayField, BooleanField } from "./Field";

describe("Field", () => {

  const booleanField = new BooleanField();
  const booleanArrayField = new ArrayField<boolean>(booleanField);

  it("#ArrayField validate", () => {
    const values = booleanArrayField.validate(["1", "false"]);
    expect(values).toEqual([true, false]);
  });

  it("#ArrayField format", () => {
    const values = booleanArrayField.format([true, false]);
    expect(values).toEqual(["true", "false"]);
  });

});
