/// <reference types="node" />
export * from "./src/ServerController";
import * as path from "path";

export const ASSET_PATH = path.resolve(__dirname, "assets");
export const RESTIFY_SERVER_PORT = "4000";
