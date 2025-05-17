// src/types/styled.d.ts
import 'styled-components';
import { MD3Theme } from 'react-native-paper';

declare module 'styled-components' {
  export interface DefaultTheme extends MD3Theme {
    colors: MD3Theme['colors'] & {
      primary: string;
      light: string;
      success: string;
      danger: string;
      dark: string;
      muted: string;
    };
  }
}
