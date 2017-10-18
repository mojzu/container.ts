import { Field } from "../validate";
import { INodeValidateBufferOptions, NodeValidate } from "./NodeValidate";

export class BufferField extends Field<Buffer> {
  public constructor(protected readonly options: INodeValidateBufferOptions = {}) {
    super();
  }
  public validate(value: string): Buffer {
    return NodeValidate.isBuffer(value, this.options);
  }
  public format(value: Buffer): string {
    return value.toString(this.options.encoding);
  }
}

export class FileField extends Field<string> {
  public validate(value: string): string {
    return NodeValidate.isFile(value);
  }
  public format(value: string): string {
    return value;
  }
}

export class DirectoryField extends Field<string> {
  public validate(value: string): string {
    return NodeValidate.isDirectory(value);
  }
  public format(value: string): string {
    return value;
  }
}
