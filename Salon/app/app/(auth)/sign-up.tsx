import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
} from "react-native";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";

import { isClerkAPIResponseError, useSignUp } from "@clerk/clerk-expo";
import CustomInput from "@/src/components/Login/CustomInput";
import CustomButton from "@/src/components/Login/CustomButton";
import { Touchable } from "@/src/styles";
import theme from "@/src/styles/theme.json";

const signUpSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email"),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password should be at least 8 characters long"),
});

type SignUpFields = z.infer<typeof signUpSchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case "email_address":
      return "email";
    case "password":
      return "password";
    default:
      return "root";
  }
};

export default function SignUpScreen() {
  const handleLogin = () => {
    // chama a tela de login
    router.push("/home" as any);
  };
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
  });

  const { signUp, isLoaded } = useSignUp();

  const onSignUp = async (data: SignUpFields) => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareVerification({ strategy: "email_code" });

      router.push("/verify");
    } catch (err) {
      console.log("Sign up error: ", err);
      if (isClerkAPIResponseError(err)) {
        err.errors.forEach((error) => {
          console.log("Error: ", JSON.stringify(error, null, 2));
          const fieldName = mapClerkErrorToFormField(error);
          console.log("Field name: ", fieldName);
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
      <Text style={styles.title}>Crie um conta</Text>

      <View style={styles.form}>
        <CustomInput
          control={control}
          name="email"
          placeholder="Email"
          autoFocus
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <CustomInput
          control={control}
          name="password"
          placeholder="Senha"
          secureTextEntry
        />
        {errors.root && (
          <Text style={{ color: "crimson" }}>{errors.root.message}</Text>
        )}
      </View>

      <CustomButton text="Cadastrar" onPress={handleSubmit(onSignUp)} />
      <Touchable onPress={handleLogin} style={styles.link}>
        <Text style={{ color: theme.colors.light }}>Já possui uma conta?</Text>
        <Text style={styles.link}> Entrar</Text>
      </Touchable>

      {/* <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 'auto' }}>
        <SignInWith strategy='oauth_google' />
        <SignInWith strategy='oauth_facebook' />
        <SignInWith strategy='oauth_apple' />
      </View> */}
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
  link: {
    color: "#4353FD",
    fontWeight: "600",
  },
});
