import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Module } from "./module";

/** Module class with RxJS unsubscribe subject embedded for usability. */
export class RxModule extends Module {
  /** Default module name. */
  public static readonly moduleName: string = "RxModule";

  /** Internal observable management subject. */
  protected readonly unsubscribe$ = new Subject<void>();

  public moduleDown(): void {
    this.unsubscribe$.next();
  }

  public moduleDestroy(): void {
    this.unsubscribe$.complete();
  }

  /** Utility function for piping observable through takeUntil. */
  public takeUntilDown<T>(observable$: Observable<T>): Observable<T> {
    return observable$.pipe(takeUntil(this.unsubscribe$));
  }
}
