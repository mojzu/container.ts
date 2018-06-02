import { ErrorChain } from "../error-chain";

describe("ErrorChain", () => {
  const rootError = new Error("UnknownError");
  const wrapError = new ErrorChain({ name: "ErrorOne", value: 1 }, rootError);
  const chainError = new ErrorChain({ name: "ErrorTwo", value: 2 }, wrapError);

  const serialised = chainError.serialise();
  const deserialised = ErrorChain.deserialise(serialised);

  it("joinNames returns error name values separated by periods", () => {
    expect(chainError.joinNames()).toEqual("ErrorTwo.ErrorOne.Error");
  });

  it("serialise returns expected serialisable object", () => {
    expect(serialised.ErrorChain.length).toEqual(3);
    expect(serialised.ErrorChain[0].name).toEqual("ErrorTwo");
    expect(serialised.ErrorChain[1].name).toEqual("ErrorOne");
    expect(serialised.ErrorChain[2].name).toEqual("Error");
  });

  it("deserialise returns ErrorChain instance", () => {
    expect(deserialised).toBeDefined();
    expect(deserialised instanceof ErrorChain).toEqual(true);
  });
});
