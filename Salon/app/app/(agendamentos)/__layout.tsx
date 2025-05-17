import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { router, Stack } from "expo-router";

export default function AgendamentosLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in" as any); // melhor usar `replace` para não deixar voltar com o back
    }
  }, [isSignedIn, isLoaded]);

  if (!isLoaded) return null;

  if (!isSignedIn) return null; // evita renderizar qualquer coisa até redirecionar

  return <Stack screenOptions={{ headerShown: false }} />;
}
