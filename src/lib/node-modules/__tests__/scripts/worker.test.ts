import { Container, Environment, IModuleDependencies, IModuleOptions, Module } from "../../../../container";
import { ChildProcess } from "../../ChildProcess";
import { Observable } from "../../RxJS";

class TestModule extends Module {

  public static readonly moduleName: string = "Test";

  protected readonly childProcess: ChildProcess;

  public constructor(options: IModuleOptions) {
    super(options);

    // Responds to ping events from parent process.
    this.childProcess.listen<number>("ping")
      .subscribe((data) => {
        this.childProcess.event<number>("pong", { data: data * 2 });
      });
  }

  public moduleDependencies(...prev: IModuleDependencies[]): IModuleDependencies {
    return super.moduleDependencies(...prev, { childProcess: ChildProcess });
  }

  // Test method called from parent process.
  public testCall1(data: number): Observable<number> {
    return Observable.of(data * 2);
  }

  // Test method to call into parent process.
  public testCall2(data: string): Observable<number> {
    return this.childProcess.call("Test", "testCall2", { args: [data] });
  }

  public testCall3(data: number): Observable<string> {
    return Observable.of("\nHello, world!\n");
  }

  public testCall4(data: number): Observable<number> {
    return Observable.of(data);
  }

  public testCall5(data: number): Observable<number> {
    return this.childProcess.call("Test", "testCall5", { args: [data] });
  }

  // public testLinkCall(data: number): Observable<string> {
  //   return this.childProcess.call("Test", "testCall3");
  // }

  public testData(size: number): Observable<any[]> {
    return Observable.of(new Array(size).fill(Math.random()));
  }

}

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Worker", ENVIRONMENT)
  .registerModules([ChildProcess, TestModule]);

// Signal operational.
CONTAINER.up()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });
