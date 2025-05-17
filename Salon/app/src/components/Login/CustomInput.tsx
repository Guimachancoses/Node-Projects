import {
  TextInput,
  StyleSheet,
  TextInputProps,
  Text,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

type CustomInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  containerStyle?: StyleProp<ViewStyle>;
  errorTextStyle?: StyleProp<TextStyle>; // <--- NOVO
} & TextInputProps;

export default function CustomInput<T extends FieldValues>({
  control,
  name,
  containerStyle,
  errorTextStyle, // <--- NOVO
  ...props
}: CustomInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error },
      }) => (
        <View style={[styles.container, containerStyle]}>
          <TextInput
            {...props}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            style={[
              styles.input,
              props.style,
              { borderColor: error ? "#FFD700" : "gray" },
            ]}
          />
          <Text
            style={[
              styles.error,
              error ? styles.errorVisible : {},
              errorTextStyle, // <--- APLICADO AQUI
            ]}
          >
            {error?.message ?? " "}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    width: "100%",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: "#ccc",
    width: "100%",
    backgroundColor: "#fff",
  },
  error: {
    minHeight: 18,
    padding: 2,
    fontSize: 13,
    alignSelf: "flex-start",
    paddingHorizontal: 2,
    color: "transparent", // escondido por padrão para evitar layout jump
  },
  errorVisible: {
    color: "#f0ad4e", // amarelo visível
  },
});
