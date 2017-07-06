/// <reference types="jasmine" />
import { Environment } from "./environment";

describe("Environment", () => {

  it("#Environment", () => {
    const variables = { value: "1" };
    const environment = new Environment(variables);
    expect(environment.variables).toEqual(variables);
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
