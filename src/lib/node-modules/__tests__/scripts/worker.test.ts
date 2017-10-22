import { Observable } from "rxjs/Observable";
import { Container, Environment, IModuleDependencies, IModuleOpts, Module } from "../../../../container";
import { ChildProcess } from "../../ChildProcess";

class TestModule extends Module {

  public static readonly NAME: string = "Test";

  public get dependencies(): IModuleDependencies {
    return { childProcess: ChildProcess.NAME };
  }

  protected readonly childProcess: ChildProcess;

  public constructor(name: string, opts: IModuleOpts) {
    super(name, opts);

    // Responds to ping events from parent process.
    this.childProcess.listen<number>("ping")
      .subscribe((data) => {
        this.childProcess.event<number>("pong", data * 2);
      });
  }

  // Test method called from parent process.
  public testCall(data: number): Observable<number> {
    return Observable.of(data * 2);
  }

}

// Create environment instance using process environment.
const ENVIRONMENT = new Environment(process.env);

// Create container instance with name and environment.
// Populate container for dependency injection.
const CONTAINER = new Container("Server", ENVIRONMENT)
  .registerModule(ChildProcess.NAME, ChildProcess)
  .registerModule(TestModule.NAME, TestModule);

// Start container modules.
CONTAINER.start()
  .subscribe({
    error: (error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    },
  });