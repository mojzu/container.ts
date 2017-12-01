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
  public get moduleDependencies(): IModuleDependencies {
    return { test1: Test1, test3: Test3 };
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
  public get moduleDependencies(): IModuleDependencies {
    return { test1: Test1 };
  }
  // public moduleUp(): void {
  //   console.log("3UP!");
  // }
  // public moduleDown(): void {
  //   console.log("3DOWN!");
  // }
}

describe("Module", () => {

  const CONTAINER = new Container("Test")
    .registerModules([Test1, Test2, Test3]);

  it("#up", async () => {
    await CONTAINER.up().toPromise();
  });

  it("#down", async () => {
    await CONTAINER.down().toPromise();
  });

  it("#registerModules throws error for duplicates", () => {
    try {
      new Container("Invalid").registerModules([ Test1, Test1 ]);
      fail();
    } catch (error) {
      expect(error instanceof ContainerError).toEqual(true);
    }
  });

});
