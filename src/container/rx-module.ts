import { BehaviorSubject, Observable, Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { IModuleDestroy, IModuleHook, IModuleOptions, Module } from "./module";

/** Module class with RxJS unsubscribe and state for usability. */
export class RxModule<S = void> extends Module {
  /** Default module name. */
  public static readonly moduleName: string = "RxModule";

  /** Observable state with takeUntil, filter pipe applied. */
  public readonly rxState$: Observable<S>;

  /** Internal observable subscription management. */
  protected readonly rxUnsubscribe$ = new Subject<void>();

  /** Internal observable state management. */
  protected readonly rxStateRaw$ = new BehaviorSubject<S>(undefined as any);

  public constructor(options: IModuleOptions) {
    super(options);
    this.rxState$ = this.rxTakeUntilModuleDown(this.rxStateRaw$).pipe(filter((x) => x != null));
  }

  public moduleDown(...args: IModuleHook[]) {
    return super.moduleDown(...args, async () => {
      this.rxUnsubscribe$.next();
    });
  }

  public moduleDestroy(...args: IModuleDestroy[]) {
    return super.moduleDestroy(...args, () => {
      this.rxUnsubscribe$.complete();
      this.rxStateRaw$.complete();
    });
  }

  /** Utility function for piping observable through takeUntil. */
  public rxTakeUntilModuleDown<T>(observable$: Observable<T>): Observable<T> {
    return observable$.pipe(takeUntil(this.rxUnsubscribe$));
  }
}
