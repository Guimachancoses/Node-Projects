import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  View,
  ImageBackground,
} from "react-native";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { isClerkAPIResponseError, useSignUp } from "@clerk/clerk-expo";
import CustomInput from "@/src/components/Login/CustomInput";
import CustomButton from "@/src/components/Login/CustomButton";
import theme from "@/src/styles/theme.json"; // importa o theme

const verifySchema = z.object({
  code: z.string({ message: "Code is required" }).length(6, "Invalid code"),
});

type VerifyFields = z.infer<typeof verifySchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case "code":
      return "code";
    default:
      return "root";
  }
};

export default function VerifyScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyFields>({
    resolver: zodResolver(verifySchema),
  });

  const { signUp, isLoaded, setActive } = useSignUp();

  const onVerify = async ({ code }: VerifyFields) => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        setActive({ session: signUpAttempt.createdSessionId });
      } else {
        setError("root", { message: "Could not complete the sign up" });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          const fieldName = mapClerkErrorToFormField(error);
          setError(fieldName, {
            message: error.longMessage,
          });
        });
      } else {
        setError("root", { message: "Unknown error" });
      }
    }
  };

  return (
    <ImageBackground
      source={require("@/src/assets/images/background_parrudus.jpg")} // substitua por sua imagem
      style={styles.background}
      resizeMode="cover"
    >
      <Text style={styles.title}>Verifique seu e-mail</Text>

      <View style={styles.form}>
        <CustomInput
          control={control}
          name="code"
          placeholder="123456"
          autoFocus
          autoCapitalize="none"
          keyboardType="number-pad"
          autoComplete="one-time-code"
        />

        {errors.root && (
          <Text style={{ color: "crimson" }}>{errors.root.message}</Text>
        )}
      </View>

      <CustomButton text="Verificar" onPress={handleSubmit(onVerify)} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    padding: 50,
    gap: 20,
  },
  form: {
    gap: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
  },
});
