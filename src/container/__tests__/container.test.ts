import { Subject } from "rxjs";
import { ErrorChain } from "../../lib/error";
import { Container, ContainerError } from "../container";
import { Environment } from "../environment";
import { Module, ModuleLog, ModuleMetric } from "../module";

describe("Container", () => {
  it("ContainerError is instance of expected classes", () => {
    const error = new ContainerError("unknown");
    expect(error instanceof Error).toEqual(false);
    expect(ErrorChain.isError(error)).toEqual(true);
    expect(error instanceof ErrorChain).toEqual(true);
    expect(ErrorChain.isErrorChain(error)).toEqual(true);
    expect(error instanceof ContainerError).toEqual(true);
  });

  it("class has expected properties", () => {
    const name = "test";
    const container = new Container(name);
    expect(container.name).toEqual(name);
    expect(container.environment instanceof Environment).toEqual(true);
    expect(container.moduleNames).toEqual([]);
    expect(container.logs$ instanceof Subject).toEqual(true);
    expect(container.metrics$ instanceof Subject).toEqual(true);
  });

  it("module is registered/resolved and has expected properties", () => {
    const name = "test";
    const container = new Container(name);
    expect(container.registerModule(Module) instanceof Container).toEqual(true);
    const testModule = container.resolve<Module>(Module.moduleName);
    expect(testModule instanceof Module);
    expect(testModule.container).toEqual(container);
    expect(testModule.environment).toEqual(container.environment);
    expect(testModule.moduleName).toEqual(Module.moduleName);
    expect(testModule.namespace).toEqual(`${name}.${Module.moduleName}`);
    expect(testModule.log instanceof ModuleLog).toEqual(true);
    expect(testModule.metric instanceof ModuleMetric).toEqual(true);
    expect(testModule.debug).toBeDefined();
  });
});
