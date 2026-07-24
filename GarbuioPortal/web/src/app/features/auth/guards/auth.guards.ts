import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom, filter, take } from 'rxjs';

import { ReduxStoreService } from '../../../core/state/redux-store.service';
import { restoreRequested } from '../store/auth.actions';
import { selectAuthState } from '../store/auth.selectors';
import { AuthState } from '../store/auth.state';

async function restoredAuthState(store: ReduxStoreService): Promise<AuthState> {
  const current = store.snapshot(selectAuthState);
  if (current.session || current.restoreRequest.status === 'success') {
    return current;
  }

  if (current.restoreRequest.status === 'idle') {
    store.dispatch(restoreRequested());
  }

  return firstValueFrom(
    store.select(selectAuthState).pipe(
      filter(
        (state) =>
          state.restoreRequest.status === 'success' || state.restoreRequest.status === 'error',
      ),
      take(1),
    ),
  );
}

export const loginGuard: CanActivateFn = async () => {
  const store = inject(ReduxStoreService);
  const router = inject(Router);
  const auth = await restoredAuthState(store);
  if ((auth.restoreRequest.error?.status ?? 0) >= 500) {
    return router.createUrlTree(['/erro/500']);
  }
  if (!auth.session) {
    return true;
  }
  return router.createUrlTree([auth.session.context ? '/ordens' : '/boas-vindas']);
};

export const welcomeGuard: CanActivateFn = async () => {
  const store = inject(ReduxStoreService);
  const router = inject(Router);
  const auth = await restoredAuthState(store);
  if ((auth.restoreRequest.error?.status ?? 0) >= 500) {
    return router.createUrlTree(['/erro/500']);
  }
  return auth.session ? true : router.createUrlTree(['/login']);
};

export const authenticatedContextGuard: CanActivateFn = async () => {
  const store = inject(ReduxStoreService);
  const router = inject(Router);
  const auth = await restoredAuthState(store);
  if ((auth.restoreRequest.error?.status ?? 0) >= 500) {
    return router.createUrlTree(['/erro/500']);
  }
  if (!auth.session) {
    return router.createUrlTree(['/login']);
  }
  return auth.session.context ? true : router.createUrlTree(['/boas-vindas']);
};
