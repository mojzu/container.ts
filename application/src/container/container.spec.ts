/// <reference types="jasmine" />
import { Subject } from "rxjs/Subject";
import { Environment } from "./environment";
import { ContainerError, Container } from "./container";

describe("Container", () => {

  it("#ContainerError", () => {
    const error = new ContainerError("unknown");
    expect(error instanceof Error).toEqual(true);
    expect(error instanceof ContainerError).toEqual(true);
  });

  it("#Container", () => {
    const name = "test";
    const container = new Container(name);
    expect(container.name).toEqual(name);
    expect(container.environment instanceof Environment).toEqual(true);
    expect(container.modules).toEqual([]);
    expect(container.bus instanceof Subject).toEqual(true);
  });

});
