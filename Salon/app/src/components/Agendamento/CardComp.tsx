import { View, Image } from "react-native";
import React from "react";
import MaterialCommunityIcons from "@/src/components/Agendamento/MCIcon";

import util from "@/src/constants/util";
import theme from "@/src/styles/theme.json";
import { Box, Spacer, Text, Touchable } from "@/src/styles";
import { useTheme } from "react-native-paper";

interface CardProps {
  preferenciaPagamento: string;
  onPress: () => void;
}

export default function CardComp({ onPress, preferenciaPagamento }: CardProps) {
  const { colors, dark } = useTheme();

  const isDarkMode = dark;

  const dynamicTextColor = isDarkMode ? "light" : "dark";
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text bold hasPadding color={dynamicTextColor}>
        Como você gostaria de pagar?
      </Text>
      <View
        style={{
          paddingHorizontal: 20,
        }}
      >
        <Touchable
          background={
            preferenciaPagamento === "L"
              ? util.toAlpha(theme.colors.muted, 5)
              : theme.colors.dark
          }
          border={
            preferenciaPagamento === "L"
              ? `0.5px solid ${util.toAlpha(theme.colors.muted, 50)}`
              : theme.colors.light
          }
          align="center"
          justify="space-between"
          spacing="0 0 10px"
          onPress={onPress}
        >
          <Box
            justify="space-between"
            width="85%"
            align="center"
            spacing="0 20px 0"
          >
            <Box align="center" justify="center">
              <Image
                source={{
                  uri: preferenciaPagamento === "L" ? "https://cdn-icons-png.flaticon.com/512/2534/2534191.png" : "https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png",
                }}
                style={{
                  width: 40,
                  height: 40,
                }}
              />
              <Text small bold spacing="0 10px 0" color={preferenciaPagamento === "L" ? dynamicTextColor : theme.colors.light}>
                {preferenciaPagamento === "L"
                  ? "Pagamento no local"
                  : "Pagar com o Mercado Pago"}
              </Text>
            </Box>
            <MaterialCommunityIcons
              name="cog-outline"
              color={theme.colors.muted}
              size={20}
              style={{ paddingRight: 20 }}
            />
          </Box>
        </Touchable>
      </View>
    </View>
  );
}
