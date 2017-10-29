import { Observable } from "./RxJS";

/** Container options injected by awilix library. */
export interface IModuleOpts {
  [key: string]: any;
}

/** Module dependencies. */
export interface IModuleDependencies {
  [key: string]: string;
}

/** Module constructor interface. */
export interface IModuleConstructor {
  new(name: string, opts: IModuleOpts): IModule;
}

/** Container module. */
export interface IModule {
  name: string;
  up(): void | Observable<void>;
  down(): void | Observable<void>;
}

/** Module state interface. */
export interface IModuleState {
  [key: string]: boolean;
}
