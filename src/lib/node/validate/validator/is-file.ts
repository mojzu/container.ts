import { lstatSync } from "fs";
import { resolve } from "path";
import { Field } from "../../validate";
import { ENodeValidateError, NodeValidateError } from "../validate";

/** Validate that value is a valid path to a file. */
export function isFile(value = ""): string {
  let isValid = false;

  try {
    value = resolve(value);
    isValid = lstatSync(value).isFile();
  } catch (error) {
    throw new NodeValidateError(ENodeValidateError.IsFileError, value, error);
  }

  if (!isValid) {
    throw new NodeValidateError(ENodeValidateError.IsFileError, value);
  }
  return value;
}

export class FileField extends Field<string> {
  public validate(value: string): string {
    return isFile(value);
  }
}
