import { Inject, Injectable } from '@angular/core';
import { distinctUntilChanged, Observable, shareReplay } from 'rxjs';

import { AppAction } from './app-action';
import { APP_STORE, AppStore } from './app-store';
import { AppState } from './app-state';

@Injectable({ providedIn: 'root' })
export class ReduxStoreService {
  constructor(@Inject(APP_STORE) private readonly store: AppStore) {}

  dispatch(action: AppAction): void {
    this.store.dispatch(action);
  }

  select<Result>(
    selector: (state: AppState) => Result,
    compare: (previous: Result, current: Result) => boolean = Object.is,
  ): Observable<Result> {
    return new Observable<Result>((subscriber) => {
      subscriber.next(selector(this.store.getState()));

      return this.store.subscribe(() => {
        subscriber.next(selector(this.store.getState()));
      });
    }).pipe(distinctUntilChanged(compare), shareReplay({ bufferSize: 1, refCount: true }));
  }

  snapshot<Result>(selector: (state: AppState) => Result): Result {
    return selector(this.store.getState());
  }
}
