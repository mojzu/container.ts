import { asValue } from "awilix";
import { Subject } from "rxjs";
import { ErrorChain } from "../../lib/error";
import { Container, ContainerError, EContainerError } from "../container";
import { Environment } from "../environment";
import { IModuleHook, Module, ModuleLog, ModuleMetric } from "../module";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

class UpTimeoutModule extends Module {
  public static readonly moduleName: string = "UpTimeoutModule";
  public moduleUp(...args: IModuleHook[]) {
    return super.moduleUp(...args, () => delay(10000));
  }
}

class DownTimeoutModule extends Module {
  public static readonly moduleName: string = "DownTimeoutModule";
  public moduleDown(...args: IModuleHook[]) {
    return super.moduleDown(...args, () => delay(10000));
  }
}

describe("Container", () => {
  it("ContainerError is instance of expected classes", () => {
    const error = new ContainerError(EContainerError.Down);
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

  it("scoped containers created and value registered/resolved", () => {
    const container = new Container("test");
    const scope = container.createScope();
    const value = 42;
    scope.register({ value: asValue(value) });
    const compareValue = scope.resolve("value");
    expect(value).toEqual(compareValue);
  });

  it("up throws timeout error", async (done) => {
    const container = new Container("UpTimeout").registerModule(UpTimeoutModule);
    try {
      await container.up(100);
      done.fail();
    } catch (error) {
      expect(error instanceof ContainerError).toEqual(true);
      done();
    }
  });

  it("down throws timeout error", async (done) => {
    const container = new Container("DownTimeout").registerModule(DownTimeoutModule);
    try {
      await container.down(100);
      done.fail();
    } catch (error) {
      expect(error instanceof ContainerError).toEqual(true);
      done();
    }
  });
});
