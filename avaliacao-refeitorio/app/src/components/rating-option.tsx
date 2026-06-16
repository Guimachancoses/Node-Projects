import { Pressable, Text, View } from "react-native";
import { theme } from "../constants/theme";

type Props = {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

export function RatingOption({ icon, title, description, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        minHeight: 118,
        backgroundColor: selected ? "#E7F0EA" : theme.colors.surface,
        borderWidth: 1.5,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        borderRadius: 22,
        paddingVertical: 16,
        paddingHorizontal: 20,
        justifyContent: "flex-start",
        gap: 6,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={{ fontSize: 34, lineHeight: 38 }}>{icon}</Text>

      <View style={{ gap: 2 }}>
        <Text
          style={{
            fontSize: 21,
            lineHeight: 25,
            fontWeight: "800",
            color: theme.colors.text,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            fontSize: 14,
            lineHeight: 18,
            color: theme.colors.muted,
          }}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
