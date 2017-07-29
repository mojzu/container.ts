/// <reference types="jasmine" />
import { ValidateError } from "./Validate";
import {
  OptionalField,
  ArrayField,
  IntegerField,
  FloatField,
  BooleanField,
  PortField,
} from "./Field";

describe("Field", () => {

  const integerField = new IntegerField();
  const optionalIntegerField = new OptionalField(integerField, 1);

  it("#IntegerField validate", () => {
    const value = integerField.validate("1");
    expect(value).toEqual(1);
  });

  it("#IntegerField format", () => {
    const value = integerField.format(1);
    expect(value).toEqual("1");
  });

  it("#OptionalField validate", () => {
    const value = optionalIntegerField.validate();
    expect(value).toEqual(1);
  });

  it("#OptionalField format", () => {
    const value = optionalIntegerField.format();
    expect(value).toEqual("1");
  });

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

  const portField = new PortField();
  const integerAndPortField = integerField.and(portField);

  it("#AndField validate", () => {
    const value = integerAndPortField.validate("42");
    expect(value).toEqual(42);
  });

  it("#AndField validate fails", () => {
    try {
      integerAndPortField.validate("123456789");
      fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
    }
  });

  const floatField = new FloatField();
  const intergerOrFloatField = integerField.or(floatField);

  it("#OrField validate", () => {
    const value = intergerOrFloatField.validate("1.0");
    expect(value).toEqual(1.0);
  });

});
