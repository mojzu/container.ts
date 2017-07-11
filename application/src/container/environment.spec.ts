/// <reference types="jasmine" />
import { Environment } from "./environment";

describe("Environment", () => {

  it("#Environment", () => {
    const variables = { value: "1" };
    const environment = new Environment(variables);
    expect(environment.variables).toEqual(variables);
  });

  it("#Environment#copy", () => {
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

  it("#Environment#get", () => {
    const value = "1";
    const variables = { value };
    const environment = new Environment(variables);
    expect(environment.get("value")).toEqual(value);
  });

  it("#Environment#set", () => {
    const value = "1";
    const environment = new Environment();
    expect(environment.set("value", value) instanceof Environment).toEqual(true);
    expect(environment.get("value")).toEqual(value);
  });

});
