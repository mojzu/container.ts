import { ErrorChain } from "../../lib/error";
import { Container, ContainerError } from "../Container";
import { Environment } from "../Environment";
import { Module, ModuleLog, ModuleMetric } from "../Module";
import { Subject } from "../RxJS";

describe("Container", () => {

  it("#ContainerError", () => {
    const error = new ContainerError("unknown");
    expect(error instanceof ErrorChain).toEqual(true);
    expect(error instanceof ContainerError).toEqual(true);
  });

  it("#Container", () => {
    const name = "test";
    const container = new Container(name);
    expect(container.name).toEqual(name);
    expect(container.environment instanceof Environment).toEqual(true);
    expect(container.moduleNames).toEqual([]);
    expect(container.logs$ instanceof Subject).toEqual(true);
    expect(container.metrics$ instanceof Subject).toEqual(true);
  });

  it("#Container#registerModule", () => {
    const name = "test";
    const container = new Container(name);
    expect(container.registerModule(Module.NAME, Module) instanceof Container).toEqual(true);
    const testModule = container.resolve<Module>(Module.NAME);
    expect(testModule instanceof Module);
    expect(testModule.container).toEqual(container);
    expect(testModule.environment).toEqual(container.environment);
    expect(testModule.name).toEqual(Module.NAME);
    expect(testModule.namespace).toEqual(`${name}.${Module.NAME}`);
    expect(testModule.log instanceof ModuleLog).toEqual(true);
    expect(testModule.metric instanceof ModuleMetric).toEqual(true);
    expect(testModule.debug).toBeDefined();
  });

});
