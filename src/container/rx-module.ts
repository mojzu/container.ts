import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { IModuleDestroy, IModuleHook, Module } from "./module";

/** Module class with RxJS unsubscribe subject embedded for usability. */
export class RxModule extends Module {
  /** Default module name. */
  public static readonly moduleName: string = "RxModule";

  /** Internal observable management subject. */
  private readonly rxUnsubscribe$ = new Subject<void>();

  public moduleDown(...args: IModuleHook[]) {
    return super.moduleDown(...args, async () => {
      this.rxUnsubscribe$.next();
    });
  }

  public moduleDestroy(...args: IModuleDestroy[]) {
    return super.moduleDestroy(...args, () => {
      this.rxUnsubscribe$.complete();
    });
  }

  /** Utility function for piping observable through takeUntil. */
  public rxTakeUntilModuleDown<T>(observable$: Observable<T>): Observable<T> {
    return observable$.pipe(takeUntil(this.rxUnsubscribe$));
  }
}
