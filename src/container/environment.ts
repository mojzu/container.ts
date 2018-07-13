import { assign, has } from "lodash";
import { ErrorChain } from "../lib/error";

/** Environment variables object. */
export interface IEnvironmentVariables {
  [key: string]: string | undefined;
}

/** Environment error class. */
export class EnvironmentError extends ErrorChain {
  public constructor(name: string, cause?: Error) {
    super({ name: "EnvironmentError", value: name }, cause);
  }
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

  /** Returns true if environment variable name is set. */
  public has(name: string): boolean {
    return has(this.variables, name);
  }

  /**
   * Get an environment variable value, or default value.
   * Throws EnvironmentError if value is undefined and no default value provided.
   */
  public get(name: string, orDefault?: string): string {
    if (this.variables[name] != null) {
      return this.variables[name] as string;
    } else if (orDefault != null) {
      return orDefault;
    } else {
      throw new EnvironmentError(name);
    }
  }

  /** Set an environment variable value. */
  public set(name: string, value: string): Environment {
    this.variables[name] = value;
    return this;
  }
}
