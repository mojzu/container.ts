import { assign, has } from "lodash";
import { ErrorChain } from "../lib/error";

/** Environment variables object. */
export interface IEnvironmentVariables {
  [key: string]: string | undefined;
}

/** Environment error codes. */
export enum EEnvironmentError {
  Get
}

/** Environment error class. */
export class EnvironmentError extends ErrorChain {
  public constructor(code: EEnvironmentError, cause?: Error, context?: object) {
    super({ name: "EnvironmentError", value: { code, ...context } }, cause);
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

  /** Returns true if environment variable key is set. */
  public has(key: string): boolean {
    return has(this.variables, key);
  }

  /**
   * Get an environment variable value, or default value.
   * Throws EnvironmentError if value is undefined and no default value provided.
   */
  public get(key: string, orDefault?: string): string {
    if (this.variables[key] != null) {
      return this.variables[key] as string;
    } else if (orDefault != null) {
      return orDefault;
    } else {
      throw new EnvironmentError(EEnvironmentError.Get, undefined, { key });
    }
  }

  /** Set an environment variable value. */
  public set(key: string, value: string): Environment {
    this.variables[key] = value;
    return this;
  }
}
