/// <reference types="jasmine" />
import { Container, Environment } from "../container";
import { RESTIFY_SERVER_PORT, ServerController } from "../examples";
import { RestifyServer } from "./RestifyServer";

describe("#RestifyServer", () => {

  const ENVIRONMENT = new Environment()
    .set(RestifyServer.ENV.PORT, RESTIFY_SERVER_PORT);

  const CONTAINER = new Container("Test", ENVIRONMENT)
    .registerModule(RestifyServer)
    .registerModule(ServerController);

  const RESTIFY_SERVER = CONTAINER.resolve<RestifyServer>(RestifyServer.name);

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

  it("#RestifyServer", () => {
    expect(RESTIFY_SERVER).toBeDefined();
    expect(RESTIFY_SERVER.name).toEqual(RestifyServer.name);
  });

});
