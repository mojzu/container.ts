/// <reference types="jasmine" />
import { ValidateError } from "./Validate";
import {
  OptionalField,
  IntegerField,
  FloatField,
  PortField,
  StringField,
  EmailField,
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
  const integerOrFloatField = integerField.or(floatField);

  it("#OrField validate", () => {
    const value = integerOrFloatField.validate("1.0");
    expect(value).toEqual(1.0);
  });

  const stringField = new StringField();
  const emailField = new EmailField();
  const stringNotEmailField = stringField.not(emailField);

  it("#NotField validate", () => {
    const value = stringNotEmailField.validate("foo");
    expect(value).toEqual("foo");
  });

  it("#NotField validate fails", () => {
    try {
      stringNotEmailField.validate("foo@example.com");
      fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
    }
  });

});
