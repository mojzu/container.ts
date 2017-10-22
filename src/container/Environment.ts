
/** Environment variables object. */
export interface IEnvironmentVariables {
  [key: string]: string | undefined;
}

/** Environment variables class. */
export class Environment {

  public constructor(
    public readonly variables: IEnvironmentVariables = {},
  ) { }

  /** Returns a copy of environment. */
  public copy(variables: IEnvironmentVariables = {}): Environment {
    return new Environment(Object.assign({}, this.variables, variables));
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
