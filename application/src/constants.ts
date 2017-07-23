import * as path from "path";

// Environment variables.
export const ENV_NAME = "APP_NAME";

// Default environment variable values.
export const DEFAULT_NAME = "Main";
export const DEFAULT_SCRIPT_PATH = path.resolve(`${__dirname}/scripts`);
export const DEFAULT_ASSET_PATH = path.resolve(`${__dirname}/../assets`);
export const DEFAULT_STATSD_HOST = "localhost";
export const DEFAULT_RESTIFY_PORT = "4000";
