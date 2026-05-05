import * as React from "react";
import { Drawer, useTheme } from "react-native-paper";
import {
  View,
  ViewStyle,
  Linking,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box, Cover, Text } from "@/src/styles";
import themeX from "@/src/styles/theme.json";
import { useClerk } from "@clerk/clerk-expo";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { router, usePathname } from "expo-router";
import { useDispatch } from "react-redux";
import { resetCliente, updateForm } from "@/src/store/modules/cliente/action";
import { resetSalao } from "@/src/store/modules/salao/actions";

type MenuComponentProps = {
  onClose?: () => void;
};

const MenuComponent = ({ onClose }: MenuComponentProps) => {
  const dispatch = useDispatch();
  const [active, setActive] = React.useState("");
  const { signOut, user } = useClerk();
  const pathname = usePathname();
  const theme = useTheme();
  const { height } = useWindowDimensions();

  const drawerStyles: ViewStyle = {
    width: 280,
    minHeight: height,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
    paddingTop: 40,
  };

  const handleClose = () => onClose?.();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left"]}>
      <View style={drawerStyles}>
        <Box align="center" justify="center">
          <Cover
            image={require("@/src/assets/images/Logo.png")}
            customWidth="150px"
            customHeight="150px"
            spacing="0 0 6px"
            circle
            resizeMode="cover"
            border={`4px solid ${theme.colors.primary}`}
          />
        </Box>

        <Box direction="column" spacing="5px 10px 0">
          <Text small bold color={theme.dark ? theme.colors.onSurface : themeX.colors.primary}>
            Olá {user?.fullName}
          </Text>
        </Box>

        <Text small bold spacing="0 10px 10px" color={theme.dark ? theme.colors.onSurface : themeX.colors.primary}>
          {user?.emailAddresses[0]?.emailAddress}
        </Text>

        <Drawer.Section>
          <Drawer.Item
            icon={() => <Icon name="home" size={24} color={themeX.colors.primary} />}
            label="Início"
            active={pathname === "/home"}
            onPress={() => {
              setActive("first");
              handleClose();
              router.push("/home");
            }}
          />

          <Drawer.Item
            icon={() => <Icon name="calendar-month-outline" size={24} color={themeX.colors.primary} />}
            label="Agendamentos"
            active={pathname === "/agendamentos"}
            onPress={() => {
              setActive("second");
              handleClose();
              router.push("/(agendamentos)/agendamentos");
            }}
          />

          <Drawer.Item
            icon={() => <Icon name="star" size={24} color={themeX.colors.primary} />}
            label="Avaliações"
            active={active === "third"}
            onPress={async () => {
              setActive("third");
              handleClose();
              const url =
                "https://search.google.com/local/writereview?placeid=ChIJ9-lVRwaByJQRX2nRsvM0_00";
              const supported = await Linking.canOpenURL(url);
              if (supported) await Linking.openURL(url);
            }}
          />

          <Drawer.Item
            icon={() => <Icon name="account" size={24} color={themeX.colors.primary} />}
            label="Cadastro"
            active={pathname === "/completRg"}
            onPress={() => {
              setActive("fifth");
              dispatch(updateForm({ behavior: "update" }));
              handleClose();
              router.push("/completRg");
            }}
          />

          <Drawer.Item
            icon={() => <Icon name="logout" size={24} color={themeX.colors.danger} />}
            label="Sair"
            background={{ color: themeX.colors.danger }}
            onPress={() => {
              handleClose();
              signOut();
              dispatch(resetCliente());
              dispatch(resetSalao());
            }}
          />
        </Drawer.Section>
      </View>
    </SafeAreaView>
  );
};

export default MenuComponent;