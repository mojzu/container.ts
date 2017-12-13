import { assign } from "lodash";

/** Environment variables object. */
export interface IEnvironmentVariables {
  [key: string]: string | undefined;
}

/** Environment variables class. */
export class Environment {

  public readonly variables: IEnvironmentVariables;

  public constructor(...variables: IEnvironmentVariables[]) {
    this.variables = assign({}, ...variables);
  }

  /** Returns a copy of environment. */
  public copy(...variables: IEnvironmentVariables[]): Environment {
    return new Environment(assign({}, this.variables, ...variables));
  }

  /** Get an environment variable value or undefined. */
  public get(name: string): string | undefined {
    return this.variables[name];
  }

  /** Set an environment variable value. */
  public set(name: string, value: string): Environment {
    this.variables[name] = value;
    return this;
  }

}
