
/** Environment variables object. */
export interface IEnvironmentVariables {
  [key: string]: string;
}

/** Environment variables class. */
export class Environment {

  public get variables(): IEnvironmentVariables { return this._variables; }

  public constructor(
    private _variables: IEnvironmentVariables = {},
  ) { }

  /** Get an environment variable value or null. */
  public get(name: string): string | null {
    return this._variables[name] || null;
  }

  /** Set an environment variable value. */
  public set(name: string, value: string): Environment {
    this._variables[name] = value;
    return this;
  }

}
