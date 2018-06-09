import { lstatSync } from "fs";
import { resolve } from "path";
import { Field } from "../../validate";
import { ENodeValidateError, NodeValidateError } from "../validate";

/** Validate that value is a valid path to a directory. */
export function isDirectory(value = ""): string {
  try {
    const resolveValue = resolve(value);
    if (lstatSync(resolveValue).isDirectory() !== true) {
      throw new NodeValidateError(ENodeValidateError.IsDirectoryError, value);
    }
    return value;
  } catch (error) {
    throw new NodeValidateError(ENodeValidateError.IsDirectoryError, value, error);
  }
}

export class DirectoryField extends Field<string> {
  public validate(value: string): string {
    return isDirectory(value);
  }
}
