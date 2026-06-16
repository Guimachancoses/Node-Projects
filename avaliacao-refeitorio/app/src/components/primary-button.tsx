import { Pressable, Text } from "react-native";
import { theme } from "../constants/theme";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ title, onPress, disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: disabled ? "#A8B8AD" : theme.colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: theme.radius.md,
        alignItems: "center",
        opacity: pressed ? 0.86 : 1,
      })}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 17,
          fontWeight: "800",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
