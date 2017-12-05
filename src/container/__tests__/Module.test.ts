import { Container, ContainerError } from "../Container";
import { Module } from "../Module";
import { IModuleDependencies } from "../Types";

// TODO(MEDIUM): Add tests for Module up/down order.

class Test1 extends Module {
  public static readonly moduleName: string = "Test1";
  // public moduleUp(): void {
  //   console.log("1UP!");
  // }
  // public moduleDown(): void {
  //   console.log("1DOWN!");
  // }
}

class Test2 extends Module {
  public static readonly moduleName: string = "Test2";
  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { test1: Test1, test3: Test3 });
  }
  // public moduleUp(): void {
  //   console.log("2UP!");
  // }
  // public moduleDown(): void {
  //   console.log("2DOWN!");
  // }
}

class Test3 extends Module {
  public static readonly moduleName: string = "Test3";
  public readonly test1: Test1;
  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { test1: Test1 });
  }
  // public moduleUp(): void {
  //   console.log("3UP!");
  // }
  // public moduleDown(): void {
  //   console.log("3DOWN!");
  // }
}

class Test4 extends Test3 {
  public static readonly moduleName: string = "Test4";
  public readonly test2: Test2;
  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { test2: Test2 });
  }
}

describe("Module", () => {

  const CONTAINER = new Container("Test1")
    .registerModules([Test1, Test2, Test3, Test4]);

  it("#up", async () => {
    await CONTAINER.up().toPromise();
  });

  it("#down", async () => {
    await CONTAINER.down().toPromise();
  });

  it("#registerModules throws error for duplicates", () => {
    try {
      new Container("Invalid").registerModules([Test1, Test1]);
      fail();
    } catch (error) {
      expect(error instanceof ContainerError).toEqual(true);
    }
  });

  it("#moduleDependencies inherited dependencies work", () => {
    const t4 = CONTAINER.resolve<Test4>(Test4.moduleName);
    expect(t4.test1 instanceof Test1).toEqual(true);
    expect(t4.test2 instanceof Test2).toEqual(true);
  });

});
