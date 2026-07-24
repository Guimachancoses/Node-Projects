import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { AuthBootstrap, LoginCredentials, SelectContextRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  login(credentials: LoginCredentials): Promise<AuthBootstrap> {
    const authorization = `Basic ${this.base64Utf8(
      `${credentials.userName}:${credentials.password}`,
    )}`;
    return firstValueFrom(
      this.http
        .post<AuthBootstrap>(`${this.config.authApiBaseUrl}/login`, null, {
          headers: new HttpHeaders({ Authorization: authorization }),
        })
        .pipe(timeout(this.config.requestTimeoutMs)),
    );
  }

  restore(): Promise<AuthBootstrap> {
    return firstValueFrom(
      this.http
        .get<AuthBootstrap>(`${this.config.authApiBaseUrl}/session`)
        .pipe(timeout(this.config.requestTimeoutMs)),
    );
  }

  selectContext(request: SelectContextRequest): Promise<AuthBootstrap> {
    return firstValueFrom(
      this.http
        .put<AuthBootstrap>(`${this.config.authApiBaseUrl}/context`, request)
        .pipe(timeout(this.config.requestTimeoutMs)),
    );
  }

  async logout(): Promise<void> {
    await firstValueFrom(
      this.http
        .delete<void>(`${this.config.authApiBaseUrl}/session`)
        .pipe(timeout(this.config.requestTimeoutMs)),
    );
  }

  private base64Utf8(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
}
