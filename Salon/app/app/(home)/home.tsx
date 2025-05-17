import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  View,
  FlatList,
  TouchableWithoutFeedback,
  PanResponder,
  Easing,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Portal } from "react-native-paper";
import { useClerk } from "@clerk/clerk-expo";

import Header from "@/Agendamento/Header";
import Servico from "@/Agendamento/Servico";
import AgendamentoBottomS from "@/Agendamento/ModalAgend";
import theme from "@/src/styles/theme.json";
import util from "@/src/constants/util";
import { Box, Touchable, Cover, Badge, Title, Text } from "@/src/styles";
import MenuComponent from "@/src/components/Menu/MenuComponet";
import {
  allServicos,
  getSalao,
  updateAgendamento,
  updateForm,
  updateTipoServicos,
  updateTypeChoice,
} from "@/src/store/modules/salao/actions";
import { filterClinte, getCliente } from "@/src/store/modules/cliente/action";
import Gradient from "@/src/components/Agendamento/Gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const MENU_WIDTH = 250;

export default function Home() {
  const dispatch = useDispatch();
  const { servicos, form, salao, tipoServicos } = useSelector(
    (state: any) => state.salao
  );
  const { cliente } = useSelector((state: any) => state.cliente);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const { user } = useClerk();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const listaBase = tipoServicos.length > 0 ? tipoServicos : [];

  //console.log(listaBase);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      dispatch(getSalao());
      dispatch(allServicos());
      dispatch(getCliente());
      dispatch(filterClinte());
      dispatch(updateAgendamento({ clienteId: cliente?.clienteId }));
      dispatch(updateForm({ modalAgendamento: false, buttonCard: false }));
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Transição suave
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? 0 : -MENU_WIDTH,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [menuVisible]);

  // Carrega dados do salão
  useEffect(() => {
    dispatch(getCliente());
    dispatch(updateAgendamento({ clienteId: cliente?.clienteId }));
  }, []);

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

  const finalServicos =
    form?.inputFiltro?.length > 0
      ? listaBase.filter((busque: any) => {
          const titulo = busque?.titulo?.toLowerCase().trim();
          const arrSearch = form?.inputFiltro?.toLowerCase().trim().split(" ");
          return arrSearch.every(
            (palavra: any) => titulo.search(palavra) !== -1
          );
        })
      : listaBase;

  return (
    <>
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
      {/* Botão de imagem (abre menu) */}
      <FlatList
        style={{ backgroundColor: util.toAlpha(theme.colors.muted, 3) }}
        ListHeaderComponent={
          <>
            {/* HEADER + FOTO DO SALÃO + AVATAR */}
            <Box
              position="absolute"
              top="20px"
              left="20px"
              zIndex={1}
              width="auto"
            >
              <Touchable
                width="40px"
                height="40px"
                background="light"
                align="center"
                justify="center"
                rounded="20px"
                border={`2px solid ${theme.colors.primary}`}
                onPress={() => setMenuVisible(true)}
              >
                <Cover
                  image={{ uri: user?.imageUrl }}
                  customWidth="50px"
                  customHeight="50px"
                  circle
                  border={`4px solid ${theme.colors.primary}`}
                  spacing="0 0 6px"
                  resizeMode="cover"
                />
              </Touchable>
            </Box>

            {/* Área da imagem e infos */}
            <View
              style={{
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 6,
              }}
            >
              <Cover
                image={require("@/src/assets/images/capa.jpg")}
                customWidth="100%"
                customHeight="300px"
                resizeMode="cover"
              >
                <Gradient>
                  <Badge color={salao.isOpened ? "success" : "danger"}>
                    {salao.isOpened ? "ABERTO" : "FECHADO"}
                  </Badge>
                  <Title color="light">{salao?.nome}</Title>
                  <Text color="light">
                    {salao?.endereco?.cidade} • {salao?.distance?.toFixed(2)}kms
                  </Text>
                </Gradient>
              </Cover>
            </View>

            {/* Filtros e título */}
            <Header />
          </>
        }
        data={finalServicos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <Servico servico={item}/>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Box align="center" justify="center" height="200px">
            {loading ? (
              <>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text spacing="10px 0 0" align="center" color={theme.colors.primary}>
                  Buscando serviços...
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.primary} />
                <Text spacing="10px 0 0" align="center" color={theme.colors.primary}>
                  Nenhum serviço encontrado
                </Text>
              </>
            )}
          </Box>
        }
      />

      <AgendamentoBottomS />
      <Modal visible={refreshing} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={{ color: "#FFF", marginTop: 10 }}>
            Atualizando dados...
          </Text>
        </View>
      </Modal>
    </>
  );
}
