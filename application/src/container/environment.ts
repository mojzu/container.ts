
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

  /** Get an environment variable value or undefined. */
  public get(name: string): string | undefined {
    return this._variables[name];
  }

  /** Get an environment variable value if defined, or return default value. */
  public getDefault(name: string, value: string): string {
    const override = this.get(name);
    if (override != undefined) {
      value = override;
    }
    return value;
  }

  /** Set an environment variable value. */
  public set(name: string, value: string): Environment {
    this._variables[name] = value;
    return this;
  }

}
