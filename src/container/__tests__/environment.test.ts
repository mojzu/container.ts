import { Environment, EnvironmentError } from "../environment";

describe("Environment", () => {
  it("has expected properties", () => {
    const variables = { value: "1" };
    const environment = new Environment(variables);
    expect(environment.variables).toEqual(variables);
  });

  it("is copied successfully, set method does not change original instance values", () => {
    const variables = { value: "1" };
    const environment = new Environment(variables);
    const environmentCopy = environment.copy({ test: "3" });
    expect(environmentCopy.set("value", "2") instanceof Environment).toEqual(true);
    const value = environment.get("value");
    const copyValue = environmentCopy.get("value");
    const testValue = environmentCopy.get("test");
    expect(value).toEqual("1");
    expect(copyValue).toEqual("2");
    expect(testValue).toEqual("3");
  });

  it("get returns expected value", () => {
    const value = "1";
    const variables = { value };
    const environment = new Environment(variables);
    expect(environment.get("value")).toEqual(value);
  });

  it("set returns Container instance and get returns expected value", () => {
    const value = "1";
    const environment = new Environment();
    expect(environment.set("value", value) instanceof Environment).toEqual(true);
    expect(environment.get("value")).toEqual(value);
  });

  it("throws error for undefined environment variable", (done) => {
    try {
      const environment = new Environment();
      environment.get("UNDEFINED_VALUE");
    } catch (error) {
      expect(error instanceof EnvironmentError).toEqual(true);
      expect(error.value).toEqual("UNDEFINED_VALUE");
      done();
    }
  });
});
