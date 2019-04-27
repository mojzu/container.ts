import { Field } from "../../validate";
import { ENodeValidateError, NodeValidateError } from "../validate";

/** NodeValidate.isBuffer options. */
export interface IIsBuffer {
  /** Optional encoding for buffer. */
  encoding?: BufferEncoding;
}

/** Validate that value is a valid Node.js Buffer. */
export function isBuffer(value = "", options: IIsBuffer = {}): Buffer {
  try {
    const buf = Buffer.from(value, options.encoding);
    if (buf == null) {
      throw new NodeValidateError(ENodeValidateError.IsBufferError, value);
    }
    return buf;
  } catch (error) {
    throw new NodeValidateError(ENodeValidateError.IsBufferError, value, error);
  }
}

export class BufferField extends Field<Buffer> {
  public constructor(protected readonly options: IIsBuffer = {}) {
    super();
  }
  public validate(value: string): Buffer {
    return isBuffer(value, this.options);
  }
  public format(value: Buffer): string {
    return value.toString(this.options.encoding);
  }
}
