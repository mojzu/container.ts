/// <reference types="jasmine" />
import { ValidateErrorCode, ValidateError, Validate } from "./Validate";

describe("Validate", () => {

  // Error tests.

  it("#ValidateError is instance of Error and ValidateError", () => {
    const error = new ValidateError(ValidateErrorCode.InvalidString);
    expect(error instanceof Error).toEqual(true);
    expect(error instanceof ValidateError).toEqual(true);
  });

  it("#ValidateError has expected properties", () => {
    const error = new ValidateError();
    expect(error.name).toEqual("ValidateError");
    expect(error.stack).toBeDefined();
    expect(error.message).toBeDefined();
  });

  // Boolean tests.

  it("#isBoolean valid boolean string", () => {
    const value = Validate.isBoolean("foo");
    expect(value).toEqual(true);
  });

  it("#isBoolean invalid type throws error", () => {
    try {
      Validate.isBoolean(42 as any);
      fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
    }
  });

  // String tests.

  const invalidString = ValidateErrorCode[ValidateErrorCode.InvalidString];

  it("#isString string", () => {
    const value = Validate.isString("foo");
    expect(value).toEqual("foo");
  });

  it("#isString empty string", () => {
    const value = Validate.isString("", { empty: true });
    expect(value).toEqual("");
  });

  it("#isString string of length", () => {
    const value = Validate.isString("escape", { maximum: 7 });
    expect(value).toEqual("escape");
  });

  it("#isString string in array", () => {
    const value = Validate.isString("foo", { values: ["bar", "foo"] });
    expect(value).toEqual("foo");
  });

  it("#isString invalid type as string", () => {
    try {
      Validate.isString(1 as any);
      fail();
    } catch (error) {
      expect(error instanceof Error).toEqual(true);
      expect(error.name).toEqual("ValidateError");
      expect(error.message).toEqual("TypeError");
    }
  });

  it("#isString empty string fails with default options", () => {
    try {
      Validate.isString("");
      fail();
    } catch (error) {
      expect(error instanceof Error).toEqual(true);
      expect(error.name).toEqual("ValidateError");
      expect(error.message).toEqual(invalidString);
    }
  });

  it("#isString string is too long", () => {
    try {
      Validate.isString("foobar", { maximum: 3 });
      fail();
    } catch (error) {
      expect(error instanceof Error).toEqual(true);
      expect(error.name).toEqual("ValidateError");
      expect(error.message).toEqual(invalidString);
    }
  });

  it("#isString string not in array", () => {
    try {
      Validate.isString("baz", { values: ["bar", "foo"] });
      fail();
    } catch (error) {
      expect(error instanceof Error).toEqual(true);
      expect(error.name).toEqual("ValidateError");
      expect(error.message).toEqual(invalidString);
    }
  });

  it("#isStringArray array of strings", () => {
    const values = Validate.isStringArray(["foo", "bar"]);
    expect(values).toEqual(["foo", "bar"]);
  });

});
