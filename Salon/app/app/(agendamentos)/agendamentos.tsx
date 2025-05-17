import {
  View,
  ImageBackground,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
  Easing,
  FlatList,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import MenuComponent from "@/src/components/Menu/MenuComponet";
import { Appbar, Portal, SegmentedButtons, useTheme } from "react-native-paper";
import { Box } from "@/src/styles";
import { router } from "expo-router";
import theme from "@/src/styles/theme.json";
import HitoricoAg from "@/src/components/Resumo/HitoricoAg";
import BtSheetResume from "@/src/components/Resumo/BtSheetResume";
import { useDispatch, useSelector } from "react-redux";
import { updateForm } from "@/src/store/modules/salao/actions";
import { filterAgendamentos } from "@/src/store/modules/cliente/action";

const MENU_WIDTH = 250;

export default function Agendamentos() {
  const dispatch = useDispatch();
  const { agendamentos, cliente } = useSelector((state: any) => state.cliente);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const [value, setValue] = React.useState("anteriores");
  const { dark } = useTheme();
  const isDarkMode = dark;
  const dynamicTextColor = isDarkMode ? "light" : "dark";
  
  //console.log("agendamentos: ", agendamentos);

  useEffect(() => {
    dispatch(filterAgendamentos({ clienteId: cliente.clienteId }));
  }, []);

  // Transição suave
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? 0 : -MENU_WIDTH,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [menuVisible]);

  // PanResponder para swipe lateral
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dx > 15 && gesture.moveX < 40,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0 && gesture.dx < MENU_WIDTH) {
          slideAnim.setValue(-MENU_WIDTH + gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 80) {
          setMenuVisible(true);
        } else {
          Animated.timing(slideAnim, {
            toValue: -MENU_WIDTH,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <ImageBackground
      source={require("@/src/assets/images/background_parrudus.jpg")} // substitua por sua imagem
      style={styles.background}
      resizeMode="cover"
    >
      {/* Menu lateral com fundo opaco */}
      {menuVisible && (
        <Portal>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              backgroundColor: "rgba(0,0,0,0.4)",
              flexDirection: "row",
              zIndex: 9999,
            }}
          >
            <Animated.View
              style={{
                width: MENU_WIDTH,
                transform: [{ translateX: slideAnim }],
              }}
            >
              <MenuComponent />
            </Animated.View>

            <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
              <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>
          </View>
        </Portal>
      )}
      {/* Área invisível para detectar swipe da borda */}
      {!menuVisible && (
        <View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 20,
            height: "100%",
            zIndex: 9998,
          }}
        />
      )}
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.light} // ← Ícone "voltar" claro
          onPress={() => {
            router.push("/home");
            setMenuVisible(false);
            dispatch(updateForm({ buttomSheetDt: 0 }));
          }}
        />
        <Appbar.Content
          title="Agendamentos"
          titleStyle={{ color: theme.colors.light }} // ← Título claro
        />
        <Appbar.Action
          icon="menu"
          color={theme.colors.light} // ← Ícone "menu" claro
          onPress={() => {
            setMenuVisible(true);
          }}
        />
      </Appbar.Header>
      <Box hasPadding>
        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          buttons={[
            {
              value: "anteriores",
              label: "Anteriores",
              labelStyle: {
                color: value === "anteriores" ? dynamicTextColor : "#fff",
              },
            },
            {
              value: "proximos",
              label: "Próximos",
              labelStyle: {
                color: value === "proximos" ? dynamicTextColor : "#fff",
              },
            },
          ]}
        />
      </Box>
      <FlatList
          data={agendamentos}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <HitoricoAg agendamento={item} value={value} />}
          keyboardShouldPersistTaps="handled"
        />
      <BtSheetResume />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});
