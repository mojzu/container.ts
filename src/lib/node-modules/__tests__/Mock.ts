import { Module } from "../../../container";
import { Observable } from "../../../container/RxJS";

export class TestModule extends Module {
  public static readonly moduleName: string = "Test";
  // Test method called from child process.
  public testCall2(data: string): Observable<number> {
    return Observable.of(data.length);
  }
}
