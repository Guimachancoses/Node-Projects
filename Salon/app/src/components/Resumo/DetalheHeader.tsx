import React from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Touchable, Text, Spacer, Box } from "@/src/styles";
import { useTheme } from "react-native-paper";

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    height: 70,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
});

export default function DetalheHeader() {
  const { colors, dark } = useTheme();

  // Para seu Text custom (chaves do tema local)
  const dynamicTextColor = dark ? "light" : "dark";

  // Para Icon (cor real)
  const iconColor = colors.onSurface;

  return (
    <View style={styles.headerContainer}>

      <Touchable>
        <Box align="center">
          <Icon name="chevron-left" color={iconColor} size={30} style={{ paddingLeft: 10 }} />
          <View style={{ marginLeft: 20 }}>
            <Text color={dynamicTextColor}>Detalhes do Agendamento</Text>
            <Spacer size="3px" />
            <Text small color={dynamicTextColor}>
              Informações sobre horário, pagamento e profissional.
            </Text>
          </View>
        </Box>
      </Touchable>

    </View>
  );
}