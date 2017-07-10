/// <reference types="jasmine" />
import { Subject } from "rxjs/Subject";
import { Environment } from "./environment";
import { ContainerError, Container, ContainerModule, ContainerModuleLog } from "./container";

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

  it("#Container#registerModule", () => {
    const name = "test";
    const container = new Container(name);
    const moduleName = "testModule";
    expect(container.registerModule(moduleName, ContainerModule) instanceof Container).toEqual(true);
    const testModule = container.resolve<ContainerModule>(moduleName);
    expect(testModule instanceof ContainerModule);
    expect(testModule.container).toEqual(container);
    expect(testModule.environment).toEqual(container.environment);
    expect(testModule.name).toEqual(moduleName);
    expect(testModule.namespace).toEqual(`${name}.${moduleName}`);
    expect(testModule.log instanceof ContainerModuleLog).toEqual(true);
    expect(testModule.debug).toBeDefined();
  });

});
