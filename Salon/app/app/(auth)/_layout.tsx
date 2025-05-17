import { Redirect, Stack } from "expo-router";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";
import theme from "@/src/styles/theme.json";
import { useDispatch } from "react-redux";
import {
  filterClinte,
  updateCliente,
} from "@/src/store/modules/cliente/action";
import { useEffect } from "react";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useClerk(); // ✅ fora de if
  const dispatch = useDispatch(); // ✅ fora de if

  useEffect(() => {
    if (isSignedIn && user) {
      dispatch(
        updateCliente({
          email: user.primaryEmailAddress?.emailAddress || "",
          nome: user.firstName || "",
          sobrenome: user.lastName || "",
        })
      );
      dispatch(filterClinte());
    }
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="sign-in"
        options={{ headerShown: false, title: "Sign in" }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: "Login",
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="verify"
        options={{
          title: "Verificação",
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
    </Stack>
  );
}
