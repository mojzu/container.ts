import { Container, ContainerError } from "../container";
import { IModuleDependencies, IModuleDestroy, IModuleHook, Module, ModuleError } from "../module";

// Tests for Module up/down order.
const moduleUpOrder: number[] = [];
const moduleUpHookOrder: number[] = [];
const moduleDownOrder: number[] = [];
const moduleDownHookOrder: number[] = [];
const moduleDestroyOrder: number[] = [];
const moduleDestroyHookOrder: number[] = [];

class Test1 extends Module {
  public static readonly moduleName: string = "Test1";
  public moduleUp(...args: IModuleHook[]) {
    return super.moduleUp(...args, async () => {
      moduleUpOrder.push(1);
    });
  }
  public moduleDown(...args: IModuleHook[]) {
    return super.moduleDown(...args, async () => {
      moduleDownOrder.push(1);
    });
  }
  public moduleDestroy(...args: IModuleDestroy[]) {
    return super.moduleDestroy(...args, () => {
      moduleDestroyOrder.push(1);
    });
  }
}

class Test2 extends Module {
  public static readonly moduleName: string = "Test2";
  public moduleDependencies(...prev: IModuleDependencies[]) {
    return super.moduleDependencies(...prev, { test1: Test1, test3: Test3 });
  }
  public moduleUp(...args: IModuleHook[]) {
    return super.moduleUp(...args, async () => {
      moduleUpOrder.push(2);
    });
  }
  public moduleDown(...args: IModuleHook[]) {
    return super.moduleDown(...args, async () => {
      moduleDownOrder.push(2);
    });
  }
  public moduleDestroy(...args: IModuleDestroy[]) {
    return super.moduleDestroy(...args, () => {
      moduleDestroyOrder.push(2);
    });
  }
}

class Test3 extends Module {
  public static readonly moduleName: string = "Test3";
  public readonly test1!: Test1;
  public moduleDependencies(...prev: IModuleDependencies[]) {
    return super.moduleDependencies(...prev, { test1: Test1 });
  }
  public moduleUp(...args: IModuleHook[]) {
    return super.moduleUp(...args, async () => {
      moduleUpOrder.push(3);
      moduleUpHookOrder.push(3);
    });
  }
  public moduleDown(...args: IModuleHook[]) {
    return super.moduleDown(...args, async () => {
      moduleDownOrder.push(3);
      moduleDownHookOrder.push(3);
    });
  }
  public moduleDestroy(...args: IModuleDestroy[]) {
    return super.moduleDestroy(...args, () => {
      moduleDestroyOrder.push(3);
      moduleDestroyHookOrder.push(3);
    });
  }
}

class Test4 extends Test3 {
  public static readonly moduleName: string = "Test4";
  public readonly test2!: Test2;
  public moduleDependencies(...prev: IModuleDependencies[]) {
    return super.moduleDependencies(...prev, { test2: Test2 });
  }
  public moduleUp(...args: IModuleHook[]) {
    return super.moduleUp(...args, async () => {
      moduleUpOrder.push(4);
      moduleUpHookOrder.push(4);
    });
  }
  public moduleDown(...args: IModuleHook[]) {
    return super.moduleDown(...args, async () => {
      moduleDownOrder.push(4);
      moduleDownHookOrder.push(4);
    });
  }
  public moduleDestroy(...args: IModuleDestroy[]) {
    return super.moduleDestroy(...args, () => {
      moduleDestroyOrder.push(4);
      moduleDestroyHookOrder.push(4);
    });
  }
}

class DependencyErrorModule extends Module {
  public static readonly moduleName: string = "DependencyErrorModule";
  public moduleDependencies(...prev: IModuleDependencies[]) {
    return super.moduleDependencies(...prev, { test2: Test2 });
  }
}

describe("Module", () => {
  const CONTAINER = new Container("Test1").registerModules([Test1, Test2, Test3, Test4]);

  it("up calls moduleUp methods in expected order", async () => {
    await CONTAINER.up();
    expect(moduleUpOrder).toEqual([1, 3, 2, 3, 4]);
    expect(moduleUpHookOrder).toEqual([3, 3, 4]);
  });

  it("down calls moduleDown methods in expected order", async () => {
    await CONTAINER.down();
    expect(moduleDownOrder).toEqual([4, 3, 2, 3, 1]);
    expect(moduleDownHookOrder).toEqual([4, 3, 3]);
  });

  it("destroy calls moduleDestroy methods", () => {
    CONTAINER.destroy();
    expect(moduleDestroyOrder).toEqual([1, 2, 3, 4, 3]);
    expect(moduleDestroyHookOrder).toEqual([3, 4, 3]);
  });

  it("registerModules throws error for duplicate module names", (done) => {
    try {
      new Container("Invalid").registerModules([Test1, Test1]);
      done.fail();
    } catch (error) {
      expect(error instanceof ContainerError).toEqual(true);
      done();
    }
  });

  it("moduleDependencies inherited dependencies are present in module instances", () => {
    const t4 = CONTAINER.resolve<Test4>(Test4.moduleName);
    expect(t4.test1 instanceof Test1).toEqual(true);
    expect(t4.test2 instanceof Test2).toEqual(true);
  });

  it("unknown module dependency throws error during container.up", async (done) => {
    try {
      const container = new Container("test").registerModule(DependencyErrorModule);
      await container.up();
      done.fail();
    } catch (error) {
      expect(error instanceof ModuleError).toEqual(true);
      done();
    }
  });

  it("unknown module dependency throws error during container.down", async (done) => {
    try {
      const container = new Container("test").registerModule(DependencyErrorModule);
      await container.down();
      done.fail();
    } catch (error) {
      expect(error instanceof ModuleError).toEqual(true);
      done();
    }
  });
});
