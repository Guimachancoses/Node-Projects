import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  readonly authApiBaseUrl: string;
  readonly protheusApiBaseUrl: string;
  readonly requestTimeoutMs: number;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: (): ApiConfig => ({
    authApiBaseUrl: '/api/auth',
    protheusApiBaseUrl: '/api/protheus',
    requestTimeoutMs: 30_000,
  }),
});
