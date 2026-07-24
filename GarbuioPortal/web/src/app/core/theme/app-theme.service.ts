import { Injectable, signal } from '@angular/core';
import {
  PoTheme,
  PoThemeA11yEnum,
  PoThemeService,
  PoThemeTypeEnum,
  poThemeDefaultDark,
  poThemeDefaultLight,
} from '@po-ui/ng-components';

export type ThemeMode = 'light' | 'dark';

const storageKey = 'garbuio-portal-theme';
const totvsBrand = {
  '01': {
    lightest: '#d7f0fe',
    lighter: '#9cd8fc',
    light: '#6bc5fa',
    base: '#045b8f',
    dark: '#013f65',
    darker: '#002944',
    darkest: '#00182b',
  },
  '02': { base: '#045b8f' },
  '03': { base: '#045b8f' },
} as const;

const totvsDarkBrand = {
  '01': {
    lightest: '#001f33',
    lighter: '#003b5c',
    light: '#00689d',
    base: '#0b8fc7',
    dark: '#5eb8e8',
    darker: '#9bd7f5',
    darkest: '#d8f2ff',
  },
  '02': { base: '#2c9ed6' },
  '03': { base: '#7fd3f4' },
} as const;

const totvsTheme: PoTheme = {
  name: 'totvs-protheus',
  type: [
    {
      light: {
        ...poThemeDefaultLight,
        color: { ...poThemeDefaultLight.color, brand: totvsBrand },
      },
      dark: {
        ...poThemeDefaultDark,
        color: { ...poThemeDefaultDark.color, brand: totvsDarkBrand },
      },
      a11y: PoThemeA11yEnum.AA,
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class AppThemeService {
  readonly mode = signal<ThemeMode>(this.storedMode());

  constructor(private readonly poTheme: PoThemeService) {
    this.apply(this.mode());
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(storageKey, mode);
    this.apply(mode);
  }

  toggle(): void {
    this.setMode(this.mode() === 'light' ? 'dark' : 'light');
  }

  private apply(mode: ThemeMode): void {
    void this.poTheme.setTheme(
      totvsTheme,
      mode === 'dark' ? PoThemeTypeEnum.dark : PoThemeTypeEnum.light,
      PoThemeA11yEnum.AA,
      false,
    );
    document.documentElement.dataset['theme'] = mode;
  }

  private storedMode(): ThemeMode {
    return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light';
  }
}
