import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { PrimaryButton } from "../../components/primary-button";
import { theme } from "../../constants/theme";

export default function ObrigadoScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(home)" as never);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        padding: 40,
        justifyContent: "center",
        alignItems: "center",
        gap: 26,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text style={{ fontSize: 76, color: theme.colors.primary }}>✓</Text>

      <View style={{ gap: 10, alignItems: "center" }}>
        <Text style={{ fontSize: 42, fontWeight: "900", color: theme.colors.text }}>
          Avaliação enviada
        </Text>

        <Text
          style={{
            fontSize: 20,
            color: theme.colors.muted,
            textAlign: "center",
            maxWidth: 560,
            lineHeight: 28,
          }}
        >
          Obrigado por ajudar a melhorar a experiência no refeitório.
        </Text>
      </View>

      <PrimaryButton title="Nova avaliação" onPress={() => router.replace("/(home)" as never)} />
    </View>
  );
}
