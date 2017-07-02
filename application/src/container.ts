import * as debug from "debug";
import { AwilixContainer, createContainer, ResolutionMode, Lifetime } from "awilix";
// TODO: Rx imports file.

/** Container options injected by awilix library. */
export interface IContainerOpts {
  [key: string]: any;
}

/** Container module dependencies. */
export interface IContainerDepends {
  [key: string]: string;
}

/** Container reference name used internally by modules. */
export const CONTAINER_NAME = "_container";

/** Wrapper around awilix library. */
export class Container {

  private _container: AwilixContainer;
  private _modules: string[] = [];

  /** Creates a new container in proxy resolution mode. */
  public constructor() {
    this._container = createContainer({ resolutionMode: ResolutionMode.PROXY });
    this._container.registerValue(CONTAINER_NAME, this);
  }

  /** Register a module in container, has singleton lifetime by default. */
  public registerModule<T>(name: string, instance: T, lifetime = Lifetime.SINGLETON): Container {
    const options = {};
    options[name] = [instance, { lifetime }];
    this._container.registerClass(options);
    this._modules.push(name);
    return this;
  }

  /** Register a value in container. */
  public registerValue<T>(name: string, value: T): Container {
    this._container.registerValue(name, value);
    return this;
  }

  /** Resolve module in container by name. */
  public resolve<T>(name: string): T {
    return this._container.resolve<T>(name);
  }

  // TODO: Implement this.
  public up() {
    this._modules.map((name) => {
      const mod = this._container.resolve<ContainerModule>(name);
      mod.up();
    });
  }

  public down() { }

}

/** Base class for container class modules with dependency injection. */
export class ContainerModule {

  private _container: Container;
  private _debug: debug.IDebugger;

  public get container(): Container { return this._container; }
  public get debug(): debug.IDebugger { return this._debug; }

  public constructor(opts: IContainerOpts, name: string, depends: IContainerDepends = {}) {
    this._container = opts[CONTAINER_NAME];
    this._debug = debug(name);

    // Inject dependency values into instance.
    // Error is thrown by awilix if resolution failed.
    Object.keys(depends).map((key) => {
      const target = depends[key];
      this[key] = opts[target];
    });
  }

  // TODO: State callbacks.
  public up() { }

}
