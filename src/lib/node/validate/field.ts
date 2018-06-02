import { Field } from "../../validate";
import * as NodeValidate from "./node-validate";

export class BufferField extends Field<Buffer> {
  public constructor(protected readonly options: NodeValidate.INodeValidateBuffer = {}) {
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
}

export class DirectoryField extends Field<string> {
  public validate(value: string): string {
    return NodeValidate.isDirectory(value);
  }
}
