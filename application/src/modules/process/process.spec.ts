/// <reference types="jasmine" />
import * as constants from "../../constants";
import { Container, Environment } from "../../container";
import { Assets } from "../assets";
import { Process } from "./process";

describe("Process", () => {

  const ENVIRONMENT = new Environment()
    .set(constants.ENV_ASSETS, constants.DEFAULT_ASSETS);

  const CONTAINER = new Container("test", ENVIRONMENT)
    .registerModule(constants.ASSETS, Assets)
    .registerModule(constants.PROCESS, Process);

  const PROCESS = CONTAINER.resolve<Process>(constants.PROCESS);

  beforeAll((done) => {
    CONTAINER.start()
      .subscribe({
        next: () => done(),
        error: (error) => done.fail(error),
      });
  });

  afterAll((done) => {
    CONTAINER.stop()
      .subscribe({
        next: () => done(),
        error: (error) => done.fail(error),
      });
  });

  it("#Process", () => {
    expect(PROCESS).toBeDefined();
    expect(PROCESS.name).toEqual(constants.PROCESS);
  });

});
