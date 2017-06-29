/// <reference types="jasmine" />
import { ping } from "./ping";

describe("Ping", () => {

  it("test", (done) => {
    ping(() => done());
  });

});
