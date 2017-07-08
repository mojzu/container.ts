import * as path from "path";

// Environment variables.
export const ENV_NODE_ENV = "NODE_ENV";
export const ENV_NAME = "APP_NAME";
export const ENV_LOG_LEVEL = "APP_LOG_LEVEL";
export const ENV_SCRIPTS = "APP_SCRIPTS";
export const ENV_ASSETS = "APP_ASSETS";

// Rollbar environment variables.
export const ENV_ROLLBAR_ACCESS_TOKEN = "APP_ROLLBAR_ACCESS_TOKEN";
export const ENV_ROLLBAR_REPORT_LEVEL = "APP_ROLLBAR_REPORT_LEVEL";

// Default environment variable values.
export const DEFAULT_NODE_ENV = "production";
export const DEFAULT_NAME = "main";
export const DEFAULT_LOG_LEVEL = "info";
export const DEFAULT_SCRIPTS = path.resolve(`${__dirname}/scripts`);
export const DEFAULT_ASSETS = path.resolve(`${__dirname}/../assets`);

// Module names.
export const ENVIRONMENT = "environment";
export const SCRIPTS = "scripts";
export const ASSETS = "assets";
export const ROLLBAR_LOG = "rollbar";
export const WINSTON_LOG = "winston";

// Assets files.
export const ASSET_PROCESS_JSON = "process.json";
