import React from "react";
import {
  Text,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { Link } from "expo-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import { useForm } from "react-hook-form";

import theme from "@/src/styles/theme.json";
import { Box, Title, Cover } from "@/src/styles";
import SocialLoginButton from "@/src/components/Login/SocialLoginButtuon";
import CustomInput from "@/src/components/Login/CustomInput";
import CustomButton from "@/src/components/Login/CustomButton";
import { ScrollView } from "react-native-gesture-handler";

const signInSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email"),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password should be at least 8 characters long"),
});

type SignInFields = z.infer<typeof signInSchema>;

const mapClerkErrorToFormField = (error: any) => {
  switch (error.meta?.paramName) {
    case "identifier":
      return "email";
    case "password":
      return "password";
    default:
      return "root";
  }
};

export default function Login() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
  });

  //console.log("Errors: ", JSON.stringify(errors, null, 2));

  const { signIn, isLoaded, setActive } = useSignIn();

  const onSignIn = async (data: SignInFields) => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === "complete") {
        setActive({ session: signInAttempt.createdSessionId });
      } else {
        //console.log("Sign in failed");
        setError("root", { message: "Sign in could not be completed" });
      }
    } catch (err) {
      //console.log("Sign in error: ", JSON.stringify(err, null, 2));

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

    //console.log("Sign in: ", data.email, data.password);
  };

  return (
    <ImageBackground
      source={require("@/src/assets/images/background_parrudus.jpg")} // substitua por sua imagem
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView>
        <Box
          hasPadding
          height="340px"
          align="center"
          justify="center"
          direction="column"
          removePaddingBottom
        >
          <Title color="light">Bem Vindo!</Title>
          <Box align="center" justify="center" width="80%" spacing="0 40px 0">
            <Cover
              customHeight="200px"
              customWidth="100%"
              image={require("@/src/assets/images/logo_parrudusX.png")}
              backgroundColor="transparent"
            />
          </Box>
        </Box>
        <Box direction="column" justify="center" align="center">
          <Box direction="column" align="center" justify="center" width="100%">
            <CustomInput
              control={control}
              name="email"
              placeholder="Email"
              autoFocus
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={{ width: "80%" }}
              errorTextStyle={{ marginLeft: 40, marginRight: 15 }}
            />

            <CustomInput
              control={control}
              name="password"
              placeholder="Senha"
              secureTextEntry
              style={{ width: "80%" }}
              errorTextStyle={{ marginLeft: 40, marginRight: 15 }}
            />

            <Text
              style={[
                styles.rootError,
                errors.root ? styles.rootErrorVisible : {},
              ]}
            >
              {errors.root?.message ?? " "}
            </Text>
            <CustomButton
              text="Entrar"
              onPress={handleSubmit(onSignIn)}
              style={{ width: "80%" }}
            />
          </Box>
          <Box justify="center" spacing="10px 0 0">
            <Text style={{ color: theme.colors.light, fontWeight: "600" }}>
              Você não possui uma conta?{" "}
            </Text>
            <Link href="/sign-up" style={styles.link}>
              Cadastre-se
            </Link>
          </Box>
        </Box>

        <Box align="center" justify="center" spacing="15px 0 0">
          <Text style={{ color: "#fff" }}>__________ Ou __________</Text>
        </Box>

        <SocialLoginButton
          strategy="google"
          background="light"
          border="light"
        />
        <SocialLoginButton
          strategy="facebook"
          background="light"
          border="light"
        />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    padding: 40,
  },
  form: {
    gap: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  link: {
    color: "#4353FD",
    fontWeight: "600",
  },
  rootError: {
    minHeight: 18,
    padding: 2,
    fontSize: 13,
    marginLeft: 40,
    marginRight: 20,
    alignSelf: "flex-start",
    paddingHorizontal: 2,
    color: "transparent", // escondido por padrão
  },
  rootErrorVisible: {
    color: "#f0ad4e", // amarelo
  },
});
