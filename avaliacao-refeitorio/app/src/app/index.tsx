import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { getResponsiveLayout } from "../constants/layout";
import { theme } from "../constants/theme";

export default function PresentationScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        padding: layout.pagePadding,
        gap: 36,
      }}
    >
      <View style={{ gap: 18, maxWidth: layout.isLandscape ? 760 : "100%" }}>
        <Image
          source={require("../../assets/images/garbofood.png")}
          style={{ width: layout.isLandscape ? 180 : 180, height: layout.isLandscape ? 180 : 180, marginBottom: layout.isLandscape ? -70 : -50, marginLeft: -10, marginTop: -100 }}
          contentFit="contain"
        />

        <Text
          style={{
            fontSize: layout.isLandscape ? 56 : 44,
            fontWeight: "900",
            color: theme.colors.text,
            lineHeight: layout.isLandscape ? 62 : 50,
          }}
        >
          Sua opinião melhora o refeitório.
        </Text>

        <Text
          style={{
            fontSize: layout.subtitleSize,
            color: theme.colors.muted,
            lineHeight: layout.subtitleSize + 10,
            maxWidth: 680,
          }}
        >
          Avalie a refeição de hoje de forma rápida, simples e intuitiva.
        </Text>
      </View>

      <Pressable
        onPress={() => router.replace("/(home)" as never)}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          backgroundColor: theme.colors.primary,
          paddingVertical: 18,
          paddingHorizontal: 34,
          borderRadius: theme.radius.md,
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800" }}>Seguir</Text>
      </Pressable>
    </View>
  );
}
