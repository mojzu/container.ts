import { ErrorChain } from "../../error";
import { EValidateError, Validate, ValidateError } from "../Validate";

describe("Validate", () => {
  const invalidBoolean = EValidateError[EValidateError.InvalidBoolean];
  const invalidString = EValidateError[EValidateError.InvalidString];

  // Error tests.

  it("#ValidateError is instance of Error and ValidateError", () => {
    const error = new ValidateError(EValidateError.InvalidString);
    expect(error instanceof ErrorChain).toEqual(true);
    expect(error instanceof ValidateError).toEqual(true);
  });

  it("#ValidateError has expected properties", () => {
    const error = new ValidateError(EValidateError.InvalidBoolean);
    expect(error.name).toEqual("InvalidBoolean");
    expect(error.stack).toBeDefined();
    expect(error.message).toEqual(invalidBoolean);
  });

  it("#ValidateError passed thrown error has formatting", () => {
    const error = new ValidateError(EValidateError.InvalidString, "", new Error("Unknown"));
    expect(error.name).toEqual("InvalidString");
    expect(error.stack).toBeDefined();
    expect(error.message).toEqual(`${invalidString} "": Error: Unknown`);
  });

  // Boolean tests.

  it("#isBoolean valid boolean string", () => {
    const value = Validate.isBoolean("foo");
    expect(value).toEqual(true);
  });

  it("#isBoolean invalid type throws error", (done) => {
    try {
      Validate.isBoolean(42 as any);
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  // Integer tests.

  it("#isInterger throws error for invalid input", (done) => {
    try {
      Validate.isInteger("foo");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  it("#isInteger", () => {
    expect(Validate.isInteger("-4")).toEqual(-4);
  });

  // Float tests.

  it("#isFloat throws error for invalid input", (done) => {
    try {
      Validate.isFloat("foo");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  it("#isFloat", () => {
    expect(Validate.isFloat("42.0")).toEqual(42.0);
  });

  // String tests.

  it("#isString string", () => {
    const value = Validate.isString("foo");
    expect(value).toEqual("foo");
  });

  it("#isString empty string", () => {
    const value = Validate.isString("", { min: 0 });
    expect(value).toEqual("");
  });

  it("#isString string of length", () => {
    const value = Validate.isString("escape", { max: 7 });
    expect(value).toEqual("escape");
  });

  it("#isString string in array", () => {
    const value = Validate.isString("foo", { values: ["bar", "foo"] });
    expect(value).toEqual("foo");
  });

  it("#isString invalid type as string", (done) => {
    try {
      Validate.isString(1 as any);
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  it("#isString empty string fails with default options", (done) => {
    try {
      Validate.isString("");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  it("#isString string is too long", (done) => {
    try {
      Validate.isString("foobar", { max: 3 });
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      expect(error.message).toEqual(`${invalidString} "foobar"`);
      done();
    }
  });

  it("#isString string not in array", (done) => {
    try {
      Validate.isString("baz", { values: ["bar", "foo"] });
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      expect(error.message).toEqual(`${invalidString} "baz"`);
      done();
    }
  });

  // Port tests.

  it("#isPort", () => {
    expect(Validate.isPort("3000")).toEqual(3000);
  });

  it("#isPort throws error for invalid input", (done) => {
    try {
      Validate.isPort("foo");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  it("#isPort throws error for out of range number", (done) => {
    try {
      Validate.isPort("0");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  // Language tests.

  it("#isLanguage", () => {
    const language = Validate.isLanguage("en");
    expect(language).toEqual("en");
  });

  // Country tests.

  it("#isCountry", () => {
    const country = Validate.isCountry("GB");
    expect(country).toEqual("GB");
  });

  // Locale tests.

  it ("#isLocale", () => {
    const locale = Validate.isLocale("en_GB");
    expect(locale).toEqual("en_GB");
  });

  it("#isLocale throws error for invalid input", (done) => {
    try {
      Validate.isLocale("ab_XY");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  // Time zone tests.

  it("#isTimeZone", () => {
    const timezone = Validate.isTimeZone("Europe/London");
    expect(timezone).toEqual("Europe/London");
  });

  it("#isTimeZone throws error for invalid input", (done) => {
    try {
      Validate.isTimeZone("foo/bar");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  // Date time tests.

  it("#isDateTime", () => {
    const datetime = Validate.isDateTime("2016-05-25T09:24:15.123");
    expect(datetime.isValid).toEqual(true);
  });

  it("#isDateTime throws error for invalid input", (done) => {
    try {
      Validate.isDateTime("fooTbar");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });

  // Duration tests.

  it("#isDuration", () => {
    const duration = Validate.isDuration("PT2H7M");
    expect(duration.isValid).toEqual(true);
  });

  // Email tests.

  it("#isEmail throws error for invalid input", (done) => {
    try {
      Validate.isEmail("bar");
      done.fail();
    } catch (error) {
      expect(error instanceof ValidateError).toEqual(true);
      done();
    }
  });
});
