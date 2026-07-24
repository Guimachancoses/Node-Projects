import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { sessionCleared } from '../../features/auth/store/auth.actions';
import { API_CONFIG } from '../config/api-config';
import { ReduxStoreService } from '../state/redux-store.service';

export const apiHttpInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(API_CONFIG);
  const router = inject(Router);
  const store = inject(ReduxStoreService);

  const isProtheusRequest = request.url.startsWith(config.protheusApiBaseUrl);
  const isAuthRequest = request.url.startsWith(config.authApiBaseUrl);
  if (!isProtheusRequest && !isAuthRequest) {
    return next(request);
  }

  const apiRequest = request.clone({
    withCredentials: true,
    setHeaders: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  return next(apiRequest).pipe(
    catchError((error: unknown) => {
      if (isHttpStatus(error, 401) && !isInitialAuthenticationRequest(request.url, config)) {
        store.dispatch(sessionCleared());
        void router.navigate(['/login'], { queryParams: { expired: 1 } });
      } else if (isHttpStatus(error, 403)) {
        void router.navigateByUrl('/erro/403');
      } else if (isServerError(error)) {
        void router.navigateByUrl('/erro/500');
      }
      return throwError(() => error);
    }),
  );
};

function isInitialAuthenticationRequest(
  url: string,
  config: { readonly authApiBaseUrl: string },
): boolean {
  return url === `${config.authApiBaseUrl}/login` || url === `${config.authApiBaseUrl}/session`;
}

function isHttpStatus(error: unknown, status: number): boolean {
  return (
    typeof error === 'object' && error !== null && 'status' in error && error.status === status
  );
}

function isServerError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 500
  );
}
