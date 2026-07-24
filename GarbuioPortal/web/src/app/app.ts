import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PoMenuItem, PoMenuModule } from '@po-ui/ng-components';
import { filter } from 'rxjs';

import { ReduxStoreService } from './core/state/redux-store.service';
import { AppThemeService } from './core/theme/app-theme.service';
import { logoutRequested } from './features/auth/store/auth.actions';
import { selectAuthSession } from './features/auth/store/auth.selectors';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PoMenuModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly store = inject(ReduxStoreService);
  readonly theme = inject(AppThemeService);

  menuCollapsed = false;
  readonly showShell = signal(this.isShellRoute(this.router.url));
  readonly session = toSignal(this.store.select(selectAuthSession), { initialValue: null });
  readonly menus = computed<Array<PoMenuItem>>(() => {
    const session = this.session();
    const darkMode = this.theme.mode() === 'dark';
    const branchName = session?.context?.branchName;

    return [
      {
        id: 'sidebar-orders',
        label: 'Ordens de serviço',
        icon: 'an an-file-text',
        link: '/ordens',
        shortLabel: 'Ordens de serviço',
      },
      // {
      //   id: 'sidebar-context',
      //   label: branchName ? `Alterar contexto · ${branchName}` : 'Alterar contexto',
      //   icon: 'an an-calendar-dots',
      //   shortLabel: 'Alterar contexto',
      //   action: () => this.changeContext(),
      // },
      {
        id: 'sidebar-theme',
        label: darkMode ? 'Usar tema claro' : 'Usar tema escuro',
        icon: darkMode ? 'an an-sun' : 'an an-moon',
        shortLabel: darkMode ? 'Usar tema claro' : 'Usar tema escuro',
        action: () => this.toggleTheme(),
      },
      {
        id: 'sidebar-logout',
        label: 'Sair',
        icon: 'an an-sign-out',
        shortLabel: 'Sair',
        action: () => this.logout(),
      },
      {
        id: 'sidebar-user',
        label: session ? `${session.userName} · Grupo 01` : 'Usuário',
        icon: 'an an-user',
        shortLabel: session?.userName ?? 'Usuário',
        action: () => this.changeContext(),
      },
    ];
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.showShell.set(this.isShellRoute(event.urlAfterRedirects)));
  }

  onMenuToggle(expanded: boolean): void {
    this.menuCollapsed = !expanded;
  }

  private changeContext(): void {
    void this.router.navigateByUrl('/boas-vindas');
  }

  private toggleTheme(): void {
    this.theme.toggle();
  }

  private logout(): void {
    this.store.dispatch(logoutRequested());
    void this.router.navigateByUrl('/login');
  }

  private isShellRoute(url: string): boolean {
    return !(
      url.startsWith('/login') ||
      url.startsWith('/boas-vindas') ||
      url.startsWith('/erro/')
    );
  }
}
