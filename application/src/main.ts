/// <reference types="node" />
import { ping, hashPassword } from "./ping";
ping(() => console.log("DONE"));
hashPassword("password").subscribe((hash) => console.log(hash));
