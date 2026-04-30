import React from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Touchable, Text, Spacer, Box } from "@/src/styles";
import { useTheme } from "react-native-paper";

interface HeaderModalProps {
  onLayout?: (event: LayoutChangeEvent) => void;
}

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    flex: 1,
  },
});

export default function HeaderModal({ onLayout }: HeaderModalProps) {
  const { colors, dark } = useTheme();

  // Para seu Text custom (aceita chave: "light" | "dark")
  const dynamicTextColor = dark ? "light" : "dark";

  // Para Icon (precisa de cor real em hex/rgb)
  const iconColor = colors.onSurface;

  return (
    <View style={styles.headerContainer} onLayout={onLayout}>
      <Touchable>
        <Box align="center">
          <Icon
            name="chevron-left"
            size={30}
            style={{ paddingLeft: 10 }}
            color={iconColor}
          />
          <View style={{ marginLeft: 20 }}>
            <Text color={dynamicTextColor}>Finalizar Agendamento</Text>
            <Spacer size="3px" />
            <Text small color={dynamicTextColor}>
              Horário, pagamento e profissional.
            </Text>
          </View>
        </Box>
      </Touchable>
    </View>
  );
}