import { lstatSync } from "fs";
import { resolve } from "path";
import { Field } from "../../validate";
import { ENodeValidateError, NodeValidateError } from "../validate";

/** Validate that value is a valid path to a file. */
export function isFile(value = ""): string {
  try {
    const resolveValue = resolve(value);
    if (lstatSync(resolveValue).isFile() !== true) {
      throw new NodeValidateError(ENodeValidateError.IsFileError, value);
    }
    return resolveValue;
  } catch (error) {
    throw new NodeValidateError(ENodeValidateError.IsFileError, value, error);
  }
}

export class FileField extends Field<string> {
  public validate(value: string): string {
    return isFile(value);
  }
}
