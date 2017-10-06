import * as fs from "fs";
import * as path from "path";
import { ErrorChain } from "../error";
import { Validate } from "../validate";

/**
 * Extended validation error codes.
 */
export enum ENodeValidateError {
  InvalidBuffer,
  InvalidFile,
  InvalidDirectory,
}

/** Node validation error class. */
export class NodeValidateError extends ErrorChain {
  public constructor(code: ENodeValidateError, value?: any, cause?: Error) {
    super({ name: ENodeValidateError[code], value }, cause);
  }
}

/** Buffer validation options. */
export interface INodeValidateBufferOptions {
  encoding?: string;
}

/**
 * Node validation methods container.
 */
export class NodeValidate extends Validate {

  public static isBuffer(value = "", options: INodeValidateBufferOptions = {}): Buffer {
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

  public static isFile(value = ""): string {
    let isFile = false;

    try {
      value = path.resolve(value);
      isFile = fs.lstatSync(value).isFile();
    } catch (error) {
      throw new NodeValidateError(ENodeValidateError.InvalidFile, value, error);
    }

    if (!isFile) {
      throw new NodeValidateError(ENodeValidateError.InvalidFile, value);
    }

    return value;
  }

  public static isDirectory(value = ""): string {
    let isDirectory = false;

    try {
      value = path.resolve(value);
      isDirectory = fs.lstatSync(value).isDirectory();
    } catch (error) {
      throw new NodeValidateError(ENodeValidateError.InvalidDirectory, value, error);
    }

    if (!isDirectory) {
      throw new NodeValidateError(ENodeValidateError.InvalidDirectory, value);
    }

    return value;
  }

}
