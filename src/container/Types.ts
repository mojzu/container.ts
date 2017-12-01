import { Observable } from "./RxJS";

/** Container options injected by awilix library. */
export interface IModuleOpts {
  moduleName: string;
  opts: any;
}

/** Module dependencies. */
export interface IModuleDependencies {
  [key: string]: IModuleConstructor;
}

/** Module constructor interface. */
export interface IModuleConstructor {
  moduleName: string;
  new(opts: IModuleOpts): IModule;
}

/** Container module. */
export interface IModule {
  moduleName: string;
  moduleDependencies: IModuleDependencies;
  moduleUp(): void | Observable<void>;
  moduleDown(): void | Observable<void>;
}

/** Module state interface. */
export interface IModuleState {
  [key: string]: boolean;
}
