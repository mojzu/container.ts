import { Container } from "../Container";
import { Module } from "../Module";
import { IModuleDependencies } from "../Types";

// TODO(MEDIUM): Add tests for Module up/down order.

class Test1 extends Module {
  public static readonly NAME = "Test1";
  // public up(): void {
  //   console.log("1UP!");
  // }
  // public down(): void {
  //   console.log("1DOWN!");
  // }
}

class Test2 extends Module {
  public static readonly NAME = "Test2";
  public get dependencies(): IModuleDependencies {
    return { test1: Test1.NAME, test3: Test3.NAME };
  }
  // public up(): void {
  //   console.log("2UP!");
  // }
  // public down(): void {
  //   console.log("2DOWN!");
  // }
}

class Test3 extends Module {
  public static readonly NAME = "Test3";
  public get dependencies(): IModuleDependencies {
    return { test1: Test1.NAME };
  }
  // public up(): void {
  //   console.log("3UP!");
  // }
  // public down(): void {
  //   console.log("3DOWN!");
  // }
}

describe("Module", () => {

  const CONTAINER = new Container("Test")
    .registerModule(Test1.NAME, Test1)
    .registerModule(Test2.NAME, Test2)
    .registerModule(Test3.NAME, Test3);

  it("#up", async () => {
    await CONTAINER.up().toPromise();
  });

  it("#down", async () => {
    await CONTAINER.down().toPromise();
  });

});
