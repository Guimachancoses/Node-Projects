import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useKeepAwake } from "expo-keep-awake";
import { useEffect } from "react";
import { Platform } from "react-native";
import { NavigationBar } from "expo-navigation-bar";
import { Provider } from "react-redux";
import { theme } from "../constants/theme";
import store from "../store";

export default function RootLayout() {
  useKeepAwake();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setHidden(true);
      NavigationBar.setStyle("dark");
    }
  }, []);

  return (
    <Provider store={store}>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      />
    </Provider>
  );
}
