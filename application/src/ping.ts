import * as process from "process";
import * as fs from "fs";
import * as Rx from "rxjs";

const scrypt = require("scrypt");

export function hashPassword(password: string): Rx.Observable<string> {
  const promise = new Promise((resolve, reject) => {
    scrypt.params(1.0, 0, 0.5, (paramsError: Error, params: any) => {
      if (paramsError != null) {
        reject(paramsError);
      } else {
        scrypt.kdf(password, params, (kdfError: Error, buf: Buffer) => {
          if (kdfError != null) {
            reject(kdfError);
          } else {
            resolve(buf.toString("base64"));
          }
        });
      }
    })
  });

  return Rx.Observable.fromPromise(promise);
}

export function ping(callback: any) {

  console.log(`__filename = "${__filename}"`);
  console.log(`__dirname = "${__dirname}"`);
  console.log(`argv = ${process.argv}`);
  console.log(`cwd = ${process.cwd()}`);
  console.log(`env = ${process.env.NODE_ENV}`);

  console.log(`dirname/ = ${fs.readdirSync(`${__dirname}`)}`);
  console.log(`dirname/../ = ${fs.readdirSync(`${__dirname}/../`)}`);
  console.log(`dirname/../assets/ = ${fs.readdirSync(`${__dirname}/../assets`)}`);

  console.log("PING");
  Rx.Observable.of(0)
    .delay(3000)
    .subscribe(() => {
      console.log("PONG");
      callback();
    });

}
