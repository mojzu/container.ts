/// <reference types="node" />
import { IContainerModuleOpts, ContainerModule } from "../../container";

export class RedisCache extends ContainerModule {

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);
    // TODO: Implement this.
  }

}
