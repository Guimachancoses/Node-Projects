import { Redirect, router } from "expo-router";
import { View, StyleSheet, ActivityIndicator, Linking } from "react-native";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import Apresentacao from "@/src/components/Show/Apresentacao";
import { Box, Title, Button, Text, Touchable } from "@/src/styles";
import theme from "@/src/styles/theme.json";
import util from "@/src/constants/util";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import {
  filterClinte,
  updateCliente,
} from "@/src/store/modules/cliente/action";
import { allServicos, getSalao } from "@/src/store/modules/salao/actions";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 0,
    padding: 20,
    width: "100%",
    height: "12%",
    backgroundColor: `${util.toAlpha(theme.colors["primary"], 10)}`,
  },
});

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { user } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const [showHours, setShowHours] = useState(false);

  useEffect(() => {
    dispatch(getSalao());
    dispatch(allServicos());
  }, []);

  // Atualiza cliente com dados do Clerk
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      dispatch(
        updateCliente({
          email: user.primaryEmailAddress?.emailAddress || "",
          nome: user.firstName || "",
          sobrenome: user.lastName || "",
        })
      );
      dispatch(filterClinte());
    }
  }, [isLoaded, isSignedIn, user]);

  // Enquanto Clerk não estiver carregado ou está logado e redirecionando, mostra loading
  if (!isLoaded || isSignedIn) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleLogin = () => {
    router.push("/sign-in" as any);
  };

  return (
    <>
      <Apresentacao />
      <Box
        background={util.toAlpha(theme.colors["primary"], 10)}
        width="100%"
        height="120px"
        align="center"
        justify="center"
        direction="column"
        removePaddingBottom
      >
        <Title color="primary">Sua imagem,</Title>
        <Title color="primary">Nosso Cuidado!</Title>
      </Box>

      <Box
        width="100%"
        hasPadding
        direction="column"
        background={util.toAlpha(theme.colors["primary"], 10)}
        removePaddingTop
      >
        <Box width="100%" direction="column">
          <Text bold color="primary">
            Horário de atendimento
          </Text>
          <Touchable onPress={() => setShowHours(!showHours)}>
            <Box
              width="100%"
              justify="space-between"
              align="center"
              spacing="2px 0 0"
            >
              <Text>Fecha às 20:00</Text>
              <MaterialIcons
                name={showHours ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color={theme.colors.primary}
              />
            </Box>
          </Touchable>

          {showHours && (
            <Box direction="column" spacing="2px 0 0">
              <Text spacing="4px 0 0">Segunda à Sexta: 09:00 - 20:00</Text>
              <Text spacing="4px 0 0">Sábado: 09:00 - 20:00</Text>
              <Text spacing="4px 0 0">Domingo: Fechado</Text>
            </Box>
          )}
        </Box>

        <Box direction="column" spacing="10px 0 0" removePaddingBottom>
          <Text bold color="primary">
            Redes Sociais
          </Text>
          <Box spacing="5px 0 0">
            <Touchable
              onPress={() => Linking.openURL("https://www.instagram.com/parrudusbarbearia")}
            >
              <MaterialCommunityIcons
                name="instagram"
                size={30}
                color={theme.colors.primary}
              />
            </Touchable>

            <Touchable
              onPress={() => Linking.openURL("https://www.facebook.com/parrudusbarbearia")}
            >
              <MaterialCommunityIcons
                name="facebook"
                size={30}
                color={theme.colors.primary}
              />
            </Touchable>

            <Touchable
              onPress={() => Linking.openURL("https://parrudusbarbearia.com.br")}
            >
              <MaterialCommunityIcons
                name="web"
                size={30}
                color={theme.colors.primary}
              />
            </Touchable>
          </Box>
        </Box>
      </Box>

      <View style={styles.headerContainer}>
        <Button
          background="primary"
          mode="contained"
          block
          uppercase={false}
          onPress={handleLogin}
        >
          Vamos Começar
        </Button>
      </View>
    </>
  );
}
