import { FieldError } from "../field";
import { EmailField, FloatField, IntegerField, PortField, StringField } from "../validator";

describe("Field", () => {
  const integerField = new IntegerField();
  const optionalIntegerField = integerField.optional(1);

  it("validates integer", () => {
    const value = integerField.validate("1");
    expect(value).toEqual(1);
  });

  it("formats integer", () => {
    const value = integerField.format(1);
    expect(value).toEqual("1");
  });

  it("optional validates default value", () => {
    const value = optionalIntegerField.validate();
    expect(value).toEqual(1);
  });

  it("optional formats default value", () => {
    const value = optionalIntegerField.format();
    expect(value).toEqual("1");
  });

  const portField = new PortField();
  const integerAndPortField = integerField.and(portField);

  it("and operator validates integer", () => {
    const value = integerAndPortField.validate("42");
    expect(value).toEqual(42);
  });

  it("and operator validation fails", (done) => {
    try {
      integerAndPortField.validate("123456789");
      done.fail();
    } catch (error) {
      expect(error instanceof FieldError).toEqual(true);
      done();
    }
  });

  const floatField = new FloatField();
  const integerOrFloatField = integerField.or(floatField);

  it("or operator validates float", () => {
    const value = integerOrFloatField.validate("1.0");
    expect(value).toEqual(1.0);
  });

  const stringField = new StringField();
  const emailField = new EmailField();
  const stringNotEmailField = stringField.not(emailField);

  it("not operator validates string", () => {
    const value = stringNotEmailField.validate("foo");
    expect(value).toEqual("foo");
  });

  it("not operator validation fails", (done) => {
    try {
      stringNotEmailField.validate("foo@example.com");
      done.fail();
    } catch (error) {
      expect(error instanceof FieldError).toEqual(true);
      done();
    }
  });
});
