import * as React from "react";
import { Drawer, useTheme } from "react-native-paper";
import { View, StyleSheet, Dimensions, ViewStyle, Linking } from "react-native";
import { Box, Cover, Text } from "@/src/styles";
import themeX from "@/src/styles/theme.json";
import { useClerk } from "@clerk/clerk-expo";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { router, usePathname } from "expo-router";
import { useDispatch } from "react-redux";
import { resetCliente, updateForm } from "@/src/store/modules/cliente/action";
import { resetSalao } from "@/src/store/modules/salao/actions";

const MenuComponent = () => {
  const dispatch = useDispatch();
  const [active, setActive] = React.useState("");
  const { signOut, user } = useClerk();
  const pathname = usePathname(); // ← aqui pegamos a rota atual
  const theme = useTheme();

  const drawerStyles: ViewStyle = {
    width: 280,
    height: Dimensions.get("window").height,
    backgroundColor: theme.colors.surface,
    paddingTop: 40,
    paddingHorizontal: 10,
    position: "absolute", // agora o TS sabe que é um tipo válido
    left: 0,
    top: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
  };

  //console.log(pathname)
  return (
    <View style={drawerStyles}>
      <Box align="center" justify="center">
        <Cover
          image={require("@/src/assets/images/Lg_vd_parrudus.jpeg")}
          customWidth="150px"
          customHeight="150px"
          spacing="0 0 6px"
          circle
          resizeMode="cover"
        />
      </Box>
      <Box direction="column" spacing="5px 10px 0">
        <Text small bold color={themeX.colors.primary}>
          Olá {user?.fullName}
        </Text>
      </Box>
      <Text small bold spacing="0 10px 10px" color={themeX.colors.primary}>
        {user?.emailAddresses[0]?.emailAddress}
      </Text>
      <Drawer.Section>
        <Drawer.Item
          icon={() => (
            <Icon name="home" size={24} color={themeX.colors.primary} />
          )}
          label="Início"
          active={pathname === "/home"}
          onPress={() => {
            setActive("first"), router.push("/home");
          }}
        />
        <Drawer.Item
          icon={() => (
            <Icon
              name="calendar-month-outline"
              size={24}
              color={themeX.colors.primary}
            />
          )}
          label="Agendamentos"
          active={pathname === "/agendamentos"}
          onPress={() => {
            setActive("second");
            router.push("/(agendamentos)/agendamentos");
          }}
        />
        <Drawer.Item
          icon={() => (
            <Icon name="star" size={24} color={themeX.colors.primary} />
          )}
          label="Avaliações"
          active={active === "third"}
          onPress={async () => {
            setActive("third");
            const url = 'https://search.google.com/local/writereview?placeid=ChIJ9-lVRwaByJQRX2nRsvM0_00';
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            } else {
              console.log("Não foi possível abrir a URL: ", url);
            }
          }}
        />
        <Drawer.Item
          icon={() => (
            <Icon name="shopping" size={24} color={themeX.colors.primary} />
          )}
          label="Assinaturas"
          active={active === "fourth"}
          onPress={() => {
            setActive("fourth");
            router.push("/(assinaturas)/assinaturas");
          }}
        />
        <Drawer.Item
          icon={() => (
            <Icon name="account" size={24} color={themeX.colors.primary} />
          )}
          label="Cadastro"
          active={pathname === "/completRg"}
          onPress={() => {
            setActive("fifth");
            dispatch(updateForm({ behavior: "update" } ))
            router.push("/completRg");
          }}
        />
        <Drawer.Item
          icon={() => (
            <Icon name="logout" size={24} color={themeX.colors.danger} />
          )}
          label="Sair"
          background={{ color: themeX.colors.danger }}
          onPress={() => {
            signOut();
            dispatch(resetCliente());
            dispatch(resetSalao());
          }}
        />
      </Drawer.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    width: 280,
    height: Dimensions.get("window").height,
    paddingTop: 40,
    paddingHorizontal: 10,
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
  },
});

export default MenuComponent;
