import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { ReduxStoreService } from './core/state/redux-store.service';
import { AppThemeService } from './core/theme/app-theme.service';
import { logoutRequested } from './features/auth/store/auth.actions';
import { App } from './app';

describe('App', () => {
  const storeStub = {
    select: () =>
      of({
        userName: 'usuario.teste',
        companyGroup: '01' as const,
        context: {
          baseDate: '2026-07-24',
          branch: '0101',
          branchName: 'Matriz',
        },
      }),
    dispatch: vi.fn(),
  };
  const themeStub = {
    mode: signal<'light' | 'dark'>('light'),
    toggle: vi.fn(() => {
      themeStub.mode.update((mode) => (mode === 'light' ? 'dark' : 'light'));
    }),
  };

  beforeEach(async () => {
    storeStub.dispatch.mockClear();
    themeStub.toggle.mockClear();
    themeStub.mode.set('light');

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: ReduxStoreService, useValue: storeStub },
        { provide: AppThemeService, useValue: themeStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the PO UI shell', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('po-toolbar')).toBeFalsy();
    expect(compiled.querySelector('po-menu')).toBeTruthy();
  });

  it('should resize the content when the menu is collapsed', () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.onMenuToggle(false);
    fixture.detectChanges();

    const main = fixture.nativeElement.querySelector('main') as HTMLElement;
    expect(main.classList.contains('po-collapsed-menu')).toBe(true);
  });

  it('navigates to context selection from the sidebar', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.menus()[1].action?.();

    expect(navigation).toHaveBeenCalledWith('/boas-vindas');
  });

  it('toggles the theme and updates the sidebar action', () => {
    const fixture = TestBed.createComponent(App);
    const themeAction = fixture.componentInstance.menus()[2];

    themeAction.action?.();

    expect(themeStub.toggle).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.menus()[2].label).toBe('Usar tema claro');
    expect(fixture.componentInstance.menus()[2].icon).toBe('an an-sun');
  });

  it('dispatches logout and navigates to login from the sidebar', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.componentInstance.menus()[3].action?.();

    expect(storeStub.dispatch).toHaveBeenCalledWith(logoutRequested());
    expect(navigation).toHaveBeenCalledWith('/login');
  });

  it('shows the authenticated user and company group in the sidebar', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance.menus()[4].label).toBe('usuario.teste · Grupo 01');
  });
});
