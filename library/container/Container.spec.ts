/// <reference types="jasmine" />
import { Subject } from "rxjs/Subject";
import { ErrorChain } from "../lib/error";
import { Environment } from "./Environment";
import {
  ContainerError,
  Container,
  ContainerModule,
  ContainerModuleLog,
  ContainerModuleMetric,
} from "./Container";

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
    expect(container.modules).toEqual([]);
    expect(container.logs instanceof Subject).toEqual(true);
    expect(container.metrics instanceof Subject).toEqual(true);
  });

  it("#Container#registerModule", () => {
    const name = "test";
    const container = new Container(name);
    expect(container.registerModule(ContainerModule) instanceof Container).toEqual(true);
    const testModule = container.resolve<ContainerModule>(ContainerModule.name);
    expect(testModule instanceof ContainerModule);
    expect(testModule.container).toEqual(container);
    expect(testModule.environment).toEqual(container.environment);
    expect(testModule.name).toEqual(ContainerModule.name);
    expect(testModule.namespace).toEqual(`${name}.${ContainerModule.name}`);
    expect(testModule.log instanceof ContainerModuleLog).toEqual(true);
    expect(testModule.metric instanceof ContainerModuleMetric).toEqual(true);
    expect(testModule.debug).toBeDefined();
  });

});
