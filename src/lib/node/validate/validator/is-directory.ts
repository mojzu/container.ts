import { lstatSync } from "fs";
import { resolve } from "path";
import { Field } from "../../validate";
import { ENodeValidateError, NodeValidateError } from "../validate";

/** Validate that value is a valid path to a directory. */
export function isDirectory(value = ""): string {
  let isValid = false;

  try {
    value = resolve(value);
    isValid = lstatSync(value).isDirectory();
  } catch (error) {
    throw new NodeValidateError(ENodeValidateError.IsDirectoryError, value, error);
  }

  if (!isValid) {
    throw new NodeValidateError(ENodeValidateError.IsDirectoryError, value);
  }
  return value;
}

export class DirectoryField extends Field<string> {
  public validate(value: string): string {
    return isDirectory(value);
  }
}
