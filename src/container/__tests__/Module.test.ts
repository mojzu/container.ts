import { Container, ContainerError } from "../Container";
import { IModuleDependencies, Module } from "../Module";

// Tests for Module up/down order.
const moduleUpOrder: number[] = [];
const moduleDownOrder: number[] = [];
let moduleDestroy = 0;

class Test1 extends Module {
  public static readonly moduleName: string = "Test1";
  public moduleUp(): void {
    moduleUpOrder.push(1);
  }
  public moduleDown(): void {
    moduleDownOrder.push(1);
  }
  public moduleDestroy(): void {
    moduleDestroy++;
  }
}

class Test2 extends Module {
  public static readonly moduleName: string = "Test2";
  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { test1: Test1, test3: Test3 });
  }
  public moduleUp(): void {
    moduleUpOrder.push(2);
  }
  public moduleDown(): void {
    moduleDownOrder.push(2);
  }
  public moduleDestroy(): void {
    moduleDestroy++;
  }
}

class Test3 extends Module {
  public static readonly moduleName: string = "Test3";
  public readonly test1!: Test1;
  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { test1: Test1 });
  }
  public moduleUp(): void {
    moduleUpOrder.push(3);
  }
  public moduleDown(): void {
    moduleDownOrder.push(3);
  }
  public moduleDestroy(): void {
    moduleDestroy++;
  }
}

class Test4 extends Test3 {
  public static readonly moduleName: string = "Test4";
  public readonly test2!: Test2;
  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { test2: Test2 });
  }
  public moduleUp(): void {
    moduleUpOrder.push(4);
  }
  public moduleDown(): void {
    moduleDownOrder.push(4);
  }
}

describe("Module", () => {
  const CONTAINER = new Container("Test1").registerModules([Test1, Test2, Test3, Test4]);

  it("#up", async () => {
    await CONTAINER.up().toPromise();
    expect(moduleUpOrder).toEqual([1, 3, 2, 4]);
  });

  it("#down", async () => {
    await CONTAINER.down().toPromise();
    expect(moduleDownOrder).toEqual([4, 2, 3, 1]);
  });

  it("#destroy", () => {
    CONTAINER.destroy();
    expect(moduleDestroy).toEqual(4);
  });

  it("#registerModules throws error for duplicates", (done) => {
    try {
      new Container("Invalid").registerModules([Test1, Test1]);
      done.fail();
    } catch (error) {
      expect(error instanceof ContainerError).toEqual(true);
      done();
    }
  });

  it("#moduleDependencies inherited dependencies work", () => {
    const t4 = CONTAINER.resolve<Test4>(Test4.moduleName);
    expect(t4.test1 instanceof Test1).toEqual(true);
    expect(t4.test2 instanceof Test2).toEqual(true);
  });
});
