import React from "react";
import { View, Image } from "react-native";
import { Box, Text, Touchable } from "@/src/styles";
import theme from "@/src/styles/theme.json";

interface CardCompProps {
  imageUri: string;
  text: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string
  background?: keyof typeof theme.colors; // ex: "dark", "light", etc.
  border?: keyof typeof theme.colors;
}

export default function ButtonInput({
  imageUri,
  text,
  onPress,
  disabled,
  background = "light", // valor padrão
  color = "muted",
  border = "light",
}: CardCompProps) {
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Touchable
        width="100%"
        height="45px"
        rounded="5px"
        background={theme.colors[background]}
        border={theme.colors[border]}
        align="center"
        justify="space-between"
        onPress={onPress}
        removePaddingBottom
        disabled={disabled}
      >
        <Box justify="space-between" width="85%" align="center" spacing="0 20px 0">
          <Box align="center" justify="center">
            <Image
              source={{ uri: imageUri }}
              style={{ width: 30, height: 30 }}
            />
            <Text small bold spacing="0 10px 0" color={color}>
              {text}
            </Text>
          </Box>
        </Box>
      </Touchable>
    </View>
  );
}