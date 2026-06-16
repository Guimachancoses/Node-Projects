import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { PrimaryButton } from "../../components/primary-button";
import { getResponsiveLayout } from "../../constants/layout";
import { theme } from "../../constants/theme";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        padding: layout.pagePadding,
        justifyContent: "center",
        gap: 28,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ gap: 14 }}>
        <Image
          source={require("../../../assets/images/garbofood.png")}
          style={{ width: layout.isLandscape ? 180 : 180, height: layout.isLandscape ? 180 : 180, marginBottom: layout.isLandscape ? -70 : -50, marginLeft: -10, marginTop: -100 }}
          contentFit="contain"
        />

        <Text
          style={{
            fontSize: layout.isLandscape ? 52 : 42,
            color: theme.colors.text,
            fontWeight: "900",
            lineHeight: layout.isLandscape ? 58 : 48,
          }}
        >
          Como estava a refeição de hoje?
        </Text>

        <Text style={{ fontSize: 19, color: theme.colors.muted, maxWidth: 640, lineHeight: 28 }}>
          Avalie sua experiência no refeitório em poucos segundos.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: 26,
          gap: 8,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text style={{ fontSize: 18, color: theme.colors.muted }}>Refeição atual</Text>
        <Text style={{ fontSize: 32, fontWeight: "800", color: theme.colors.text }}>Almoço</Text>
        <Text style={{ fontSize: 17, color: theme.colors.muted, lineHeight: 24 }}>
          Sua opinião ajuda a melhorar o cardápio e a qualidade do atendimento.
        </Text>
      </View>

      <PrimaryButton title="Avaliar agora" onPress={() => router.push("/avaliar")} />
    </ScrollView>
  );
}
