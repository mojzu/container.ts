import { Observable } from "./RxJS";

/** Container options injected by awilix library. */
export interface IModuleOptions {
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
  new(options: IModuleOptions): IModule;
}

/** Container module. */
export interface IModule {
  moduleName: string;
  moduleDependencies(...previous: IModuleDependencies[]): IModuleDependencies;
  moduleUp(): void | Observable<void>;
  moduleDown(): void | Observable<void>;
}

/** Module state interface. */
export interface IModuleState {
  [key: string]: boolean;
}
