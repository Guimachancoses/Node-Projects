import "react-native-reanimated";
import React, { useState, useEffect, useCallback } from "react";
import { Slot, SplashScreen } from "expo-router";
import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import merge from "deepmerge";
import { useColorScheme } from "react-native";
import { Provider } from "react-redux";
import store from "../src/store";
import "./globals.css";
import { Colors } from "@/src/constants/Colors";
import * as Font from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider as StyledThemeProvider } from "styled-components/native";
import Toast from "react-native-toast-message";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { NotificationProvider } from "@/src/context/NotificationContext";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// <- ATENÇÃO: impede o auto-hide da splash
SplashScreen.preventAutoHideAsync();


const loadFonts = async () => {
  await Font.loadAsync({
    "Ubuntu-Regular": require("@/src/assets/fonts/Ubuntu-Regular.ttf"),
    "Ubuntu-Medium": require("@/src/assets/fonts/Ubuntu-Medium.ttf"),
    "Ubuntu-Bold": require("@/src/assets/fonts/Ubuntu-Bold.ttf"),
    "Ubuntu-Light": require("@/src/assets/fonts/Ubuntu-Light.ttf"),
  });
};

const customDarkTheme = { ...MD3DarkTheme, colors: Colors.dark };
const customLightTheme = { ...MD3LightTheme, colors: Colors.light };

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = merge(LightTheme, customLightTheme);
const CombinedDarkTheme = merge(DarkTheme, customDarkTheme);

const addFontsToTheme = (theme: any) => ({
  ...theme,
  fonts: {
    regular: { fontFamily: "Ubuntu-Regular", fontWeight: "normal" },
    medium: { fontFamily: "Ubuntu-Medium", fontWeight: "500" },
    bold: { fontFamily: "Ubuntu-Bold", fontWeight: "bold" },
    light: { fontFamily: "Ubuntu-Light", fontWeight: "300" },
  },
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function prepare() {
      try {
        // Carregar fontes e outros recursos necessários
        await loadFonts();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        // <- Agora sim, esconde a splash
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Garante que a splash só será escondida quando tudo estiver pronto
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    // Não renderiza nada enquanto prepara (splash permanece visível)
    return null;
  }

  const paperTheme =
    colorScheme !== "dark" ? CombinedDefaultTheme : CombinedDarkTheme;
  const themeWithFonts = addFontsToTheme(paperTheme);

  const publishableKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Adicione as credenciais de EXPO_CLERK");
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <Provider store={store}>
          <PaperProvider theme={paperTheme}>
            <StyledThemeProvider theme={paperTheme}>
              <ThemeProvider value={themeWithFonts}>
                <NotificationProvider>
                  <Slot />
                </NotificationProvider>
                <Toast />
              </ThemeProvider>
            </StyledThemeProvider>
          </PaperProvider>
        </Provider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}