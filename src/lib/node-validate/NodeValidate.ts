import * as fs from "fs";
import * as path from "path";
import { ErrorChain } from "../error";
import { Validate } from "../validate";

/** NodeValidate error codes. */
export enum ENodeValidateError {
  InvalidBuffer,
  InvalidFile,
  InvalidDirectory,
}

/** NodeValidate error chain class. */
export class NodeValidateError extends ErrorChain {
  public constructor(code: ENodeValidateError, value?: any, cause?: Error) {
    super({ name: ENodeValidateError[code], value }, cause);
  }
}

/** NodeValidate.isBuffer options. */
export interface INodeValidateBuffer {
  /** Optional encoding for buffer. */
  encoding?: string;
}

export function isBuffer(value = "", options: INodeValidateBuffer = {}): Buffer {
  let buf = null;

  try {
    buf = Buffer.from(value, options.encoding);
  } catch (error) {
    throw new NodeValidateError(ENodeValidateError.InvalidBuffer, value, error);
  }

  if (buf == null) {
    throw new NodeValidateError(ENodeValidateError.InvalidBuffer, value);
  }
  return buf;
}

export function isFile(value = ""): string {
  let isValid = false;

  try {
    value = path.resolve(value);
    isValid = fs.lstatSync(value).isFile();
  } catch (error) {
    throw new NodeValidateError(ENodeValidateError.InvalidFile, value, error);
  }

  if (!isValid) {
    throw new NodeValidateError(ENodeValidateError.InvalidFile, value);
  }
  return value;
}

export function isDirectory(value = ""): string {
  let isValid = false;

  try {
    value = path.resolve(value);
    isValid = fs.lstatSync(value).isDirectory();
  } catch (error) {
    throw new NodeValidateError(ENodeValidateError.InvalidDirectory, value, error);
  }

  if (!isValid) {
    throw new NodeValidateError(ENodeValidateError.InvalidDirectory, value);
  }
  return value;
}

/** Static validate methods container. */
export class NodeValidate extends Validate {
  public static isBuffer = isBuffer;
  public static isFile = isFile;
  public static isDirectory = isDirectory;
}
