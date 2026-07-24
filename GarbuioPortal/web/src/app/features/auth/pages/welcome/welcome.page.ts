import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PoButtonModule,
  PoDatepickerModule,
  PoFieldModule,
  PoPageModule,
  PoRadioGroupModule,
  PoRadioGroupOption,
  PoWidgetModule,
} from '@po-ui/ng-components';
import { filter, map } from 'rxjs';

import { AppThemeService, ThemeMode } from '../../../../core/theme/app-theme.service';
import { ReduxStoreService } from '../../../../core/state/redux-store.service';
import { contextRequested, logoutRequested } from '../../store/auth.actions';
import {
  selectAuthBranches,
  selectAuthSession,
  selectContextRequest,
  selectDefaultBaseDate,
} from '../../store/auth.selectors';

@Component({
  selector: 'app-welcome-page',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    PoButtonModule,
    PoDatepickerModule,
    PoFieldModule,
    PoPageModule,
    PoRadioGroupModule,
    PoWidgetModule,
  ],
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss',
})
export class WelcomePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly store = inject(ReduxStoreService);
  readonly theme = inject(AppThemeService);

  private submitted = false;
  readonly branches$ = this.store.select(selectAuthBranches).pipe(map((branches) => [...branches]));
  readonly contextRequest$ = this.store.select(selectContextRequest);
  readonly themeOptions: Array<PoRadioGroupOption> = [
    { label: 'Tema claro', value: 'light' },
    { label: 'Tema escuro', value: 'dark' },
  ];

  readonly form = new FormGroup({
    companyGroup: new FormControl({ value: '01', disabled: true }, { nonNullable: true }),
    baseDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    branch: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    theme: new FormControl<ThemeMode>(this.theme.mode(), { nonNullable: true }),
  });

  constructor() {
    this.store
      .select(selectDefaultBaseDate)
      .pipe(
        filter((value) => Boolean(value)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((defaultBaseDate) => {
        if (!this.form.controls.baseDate.value) {
          this.form.controls.baseDate.setValue(defaultBaseDate);
        }
      });

    this.store
      .select(selectAuthSession)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((session) => {
        if (session?.context) {
          this.form.patchValue(
            {
              baseDate: session.context.baseDate,
              branch: session.context.branch,
            },
            { emitEvent: false },
          );
        }
      });

    this.form.controls.theme.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mode) => this.theme.setMode(mode));

    this.store
      .select(selectContextRequest)
      .pipe(
        filter((request) => request.status === 'success'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.submitted) {
          void this.router.navigateByUrl('/ordens');
        }
      });
  }

  continue(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.submitted = true;
    this.store.dispatch(
      contextRequested({
        baseDate: this.form.controls.baseDate.value,
        branch: this.form.controls.branch.value,
      }),
    );
  }

  logout(): void {
    this.store.dispatch(logoutRequested());
    void this.router.navigateByUrl('/login');
  }
}
