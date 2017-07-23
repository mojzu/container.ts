import { IContainerModuleOpts, ContainerModule } from "../../container";

export class SocketioServer extends ContainerModule {

  public constructor(name: string, opts: IContainerModuleOpts) {
    super(name, opts);

    // TODO: SocketIO setup.
  }

}
