import { ErrorChain } from "../ErrorChain";

describe("ErrorChain", () => {

  const rootError = new Error("UnknownError");
  const wrapError = new ErrorChain({ name: "ErrorOne", value: 1 }, rootError);
  const chainError = new ErrorChain({ name: "ErrorTwo", value: 2 }, wrapError);

  const serialised = chainError.serialise();
  const deserialised = ErrorChain.deserialise(serialised);

  it("#serialise", () => {
    expect(serialised.ErrorChain.length).toEqual(3);
    expect(serialised.ErrorChain[0].name).toEqual("ErrorTwo");
    expect(serialised.ErrorChain[1].name).toEqual("ErrorOne");
    expect(serialised.ErrorChain[2].name).toEqual("Error");
  });

  it("#deserialise", () => {
    expect(deserialised).toBeDefined();
  });

});
