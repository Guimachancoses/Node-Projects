import { Routes } from '@angular/router';

import {
  authenticatedContextGuard,
  loginGuard,
  welcomeGuard,
} from './features/auth/guards/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'boas-vindas',
    canActivate: [welcomeGuard],
    loadComponent: () =>
      import('./features/auth/pages/welcome/welcome.page').then((module) => module.WelcomePage),
  },
  {
    path: 'ordens',
    canActivate: [authenticatedContextGuard],
    loadComponent: () =>
      import('./features/order-service/pages/order-list/order-list.page').then(
        (module) => module.OrderListPage,
      ),
  },
  {
    path: 'ordens/nova',
    canActivate: [authenticatedContextGuard],
    loadComponent: () =>
      import('./features/order-service/pages/order-editor/order-editor.page').then(
        (module) => module.OrderEditorPage,
      ),
  },
  {
    path: 'ordens/:branch/:order',
    canActivate: [authenticatedContextGuard],
    loadComponent: () =>
      import('./features/order-service/pages/order-editor/order-editor.page').then(
        (module) => module.OrderEditorPage,
      ),
  },
  {
    path: 'erro/403',
    data: {
      code: '403',
      title: 'Acesso não permitido',
      message: 'Você não possui permissão para acessar este recurso.',
    },
    loadComponent: () =>
      import('./features/errors/pages/error/error.page').then((module) => module.ErrorPage),
  },
  {
    path: 'erro/500',
    data: {
      code: '500',
      title: 'Não foi possível concluir a operação',
      message: 'Tente novamente. Se o problema continuar, contate o suporte.',
    },
    loadComponent: () =>
      import('./features/errors/pages/error/error.page').then((module) => module.ErrorPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'ordens' },
  {
    path: '**',
    data: {
      code: '404',
      title: 'Página não encontrada',
      message: 'O endereço informado não existe ou foi removido.',
    },
    loadComponent: () =>
      import('./features/errors/pages/error/error.page').then((module) => module.ErrorPage),
  },
];
