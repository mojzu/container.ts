
/** Environment variables object. */
export interface IEnvironmentVariables {
  [key: string]: string;
}

/** Environment variables class. */
export class Environment {

  /** Environment variables object. */
  public get variables(): IEnvironmentVariables { return this._variables; }

  public constructor(
    private _variables: IEnvironmentVariables = {},
  ) { }

  /** Returns a copy of environment. */
  public copy(variables: IEnvironmentVariables = {}): Environment {
    return new Environment(Object.assign(variables, this.variables));
  }

  /** Get an environment variable value or undefined. */
  public get(name: string): string | undefined {
    return this._variables[name];
  }

  /** Set an environment variable value. */
  public set(name: string, value: string): Environment {
    this._variables[name] = value;
    return this;
  }

}
