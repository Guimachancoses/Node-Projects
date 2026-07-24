import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PoPageLogin, PoPageLoginModule } from '@po-ui/ng-templates';
import { filter } from 'rxjs';

import { ReduxStoreService } from '../../../../core/state/redux-store.service';
import { NotificationPort } from '../../../../core/notifications/notification-port';
import { loginRequested } from '../../store/auth.actions';
import { selectAuthSession, selectLoginRequest } from '../../store/auth.selectors';

const rememberedUserKey = 'garbuio-portal-login';

@Component({
  selector: 'app-login-page',
  imports: [AsyncPipe, PoPageLoginModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ReduxStoreService);
  private readonly notifications = inject(NotificationPort);

  readonly loginRequest$ = this.store.select(selectLoginRequest);
  readonly rememberedUser = localStorage.getItem(rememberedUserKey) ?? '';

  constructor() {
    if (this.route.snapshot.queryParamMap.get('expired') === '1') {
      this.notifications.warning('Sua sessão expirou. Entre novamente.');
    }

    this.store
      .select(selectAuthSession)
      .pipe(
        filter((session) => session !== null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((session) => {
        void this.router.navigateByUrl(session.context ? '/ordens' : '/boas-vindas');
      });
  }

  submit(form: PoPageLogin): void {
    if (form.rememberUser) {
      localStorage.setItem(rememberedUserKey, form.login);
    } else {
      localStorage.removeItem(rememberedUserKey);
    }
    this.store.dispatch(
      loginRequested({
        userName: form.login,
        password: form.password,
      }),
    );
  }
}
