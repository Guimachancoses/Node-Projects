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
import { router } from "expo-router";

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
  resetAgendamento,
  updateAgendamento,
  updateForm,
} from "@/src/store/modules/salao/actions";
import {
    filterClinte,
  getCliente,
  pushToken,
} from "@/src/store/modules/cliente/action";
import Gradient from "@/src/components/Agendamento/Gradient";
import MaterialCommunityIconsRaw from "react-native-vector-icons/MaterialCommunityIcons";
import { useNotification } from "@/src/context/NotificationContext";
import { registerForPushNotificationsAsync } from "@/src/utils/registerForPushNotificationsAsync";
import { createEvent } from "@/src/hook/expoCalendar";
import moment from "moment";

const MaterialCommunityIcons = MaterialCommunityIconsRaw as any;
const MENU_WIDTH = 250;

export default function Home() {
  const dispatch = useDispatch();
  const { form, salao, tipoServicos, agendamento, servicos } = useSelector(
    (state: any) => state.salao
  );
  const { cliente } = useSelector((state: any) => state.cliente);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const { user } = useClerk();
  const [refreshing, setRefreshing] = useState(false);
  const [loading] = useState(false);
  const listaBase = tipoServicos.length > 0 ? tipoServicos : [];
  const { notification, error, clearNotification } = useNotification();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const clienteId = cliente?.clienteId ?? cliente?._id;
  const clerkEmail = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    // se já tem clienteId, não precisa filtrar de novo
    if (clienteId) return;

    // só chama quando já tiver email do Clerk
    if (!clerkEmail) return;

    dispatch(
      filterClinte({
        email: clerkEmail,
        shouldRedirect: false,
      })
    );
  }, [clienteId, clerkEmail, dispatch]);

  const carregarDados = React.useCallback(() => {
    dispatch(getSalao());
    dispatch(allServicos());
    dispatch(getCliente());
  }, [dispatch]);

  useEffect(() => {
    carregarDados();
    const t = setTimeout(() => setLoadingInitial(false), 1200); // ajuste fino
    return () => clearTimeout(t);
  }, [carregarDados]);

  const onRefresh = async () => {
    setRefreshing(true);
    carregarDados();
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    const clienteId = cliente?.clienteId ?? cliente?._id;
    if (!clienteId) return;

    dispatch(updateAgendamento({ clienteId }));

    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) dispatch(pushToken(token));
      } catch (err: any) {
        const msg = String(err?.message || err);

        // timeout/503: só avisa e segue app normal
        if (msg.includes("503") || msg.toLowerCase().includes("timeout")) {
          console.warn("Push token indisponível no momento, tentando depois...");
          return;
        }

        console.warn("Erro ao registrar push token:", err);
      }
    })();
  }, [cliente?.clienteId, cliente?._id, dispatch]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? 0 : -MENU_WIDTH,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [menuVisible]);

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
        return arrSearch.every((palavra: any) => titulo.search(palavra) !== -1);
      })
      : listaBase;

  useEffect(() => {
    if (error) {
      console.error("Erro ao receber notificações:", error);
    }
  }, [error]);

  if (loadingInitial) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
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

      <FlatList
        style={{ backgroundColor: util.toAlpha(theme.colors.muted, 3) }}
        ListHeaderComponent={
          <>
            <Box position="absolute" top="60px" left="20px" zIndex={1} width="auto">
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

            <Header />
          </>
        }
        data={finalServicos}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }) => <Servico servico={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={48}
                  color={theme.colors.primary}
                />
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
          <Text style={{ color: "#FFF", marginTop: 10 }}>Atualizando dados...</Text>
        </View>
      </Modal>

      <Portal>
        <Modal visible={notification !== null} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 30,
                borderRadius: 10,
                width: "80%",
              }}
            >
              <Text bold color="primary" spacing="0 0 10px" hasPadding removePaddingBottom>
                {notification?.request.content.title}
              </Text>
              <Text hasPadding removePaddingBottom>
                {notification?.request.content.body}
              </Text>
              <TouchableWithoutFeedback
                onPress={() => {
                  clearNotification();
                  router.push("/(agendamentos)/agendamentos");
                }}
              >
                <Text hasPadding removePaddingBottom bold color="primary" align="center">
                  Confirmar
                </Text>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </Modal>

        <Modal visible={!!form?.saveAgendamento} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 32,
                borderRadius: 16,
                width: "85%",
                alignItems: "center",
                elevation: 4,
              }}
            >
              <Text bold color="primary" align="center" hasPadding style={{ fontSize: 20 }}>
                Agendamento realizado com sucesso!
              </Text>
              <Text align="center" spacing="0 0 18px" style={{ color: "#666" }}>
                Seu agendamento foi confirmado. Você receberá uma notificação de lembrete
                próximo ao horário.
              </Text>

              <TouchableWithoutFeedback
                onPress={() => {
                  dispatch(updateForm({ saveAgendamento: false }));

                  const servico = servicos?.find(
                    (s: any) => s._id === agendamento?.servicoId
                  );

                  const duracaoMoment = moment.tz(servico?.duracao, "America/Sao_Paulo");
                  const horas = duracaoMoment.hours();
                  const minutos = duracaoMoment.minutes();
                  const totalMinutes = horas * 60 + minutos;

                  const startMoment = moment(agendamento?.data);
                  const endMoment = startMoment.clone().add(totalMinutes, "minutes");

                  createEvent({
                    title: "Parrudus Barbearia",
                    description: `Servico: ${servico?.titulo}`,
                    startDate: startMoment.toDate(),
                    endDate: endMoment.toDate(),
                  });

                  dispatch(resetAgendamento());
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 18,
                    marginBottom: 6,
                    width: "100%",
                  }}
                >
                  <Text bold color="white" align="center" style={{ fontSize: 16 }}>
                    Deseja sincronizar com seu calendário?
                  </Text>
                </View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback
                onPress={() => {
                  dispatch(updateForm({ saveAgendamento: false }));
                  dispatch(resetAgendamento());
                }}
              >
                <Text
                  align="center"
                  color="primary"
                  style={{ marginTop: 8, textDecorationLine: "underline" }}
                >
                  Fechar
                </Text>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </Modal>
      </Portal>
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "white", padding: 24, borderRadius: 16, width: "85%" }}>
            <Text bold color="primary" align="center" style={{ fontSize: 20 }}>
              Confirme seu agendamento
            </Text>

            <Text align="center" style={{ color: "#666", marginTop: 8 }}>
              Toque em confirmar para validar sua presença.
            </Text>

            <TouchableWithoutFeedback
              onPress={() => {
                const data = notification?.request?.content?.data as any;
                clearNotification();

                router.push({
                  pathname: "/(agendamentos)/agendamentos",
                  params: {
                    fromPush: "1",
                    action: data?.action ?? "confirmar_agendamento",
                    agendamentoId: data?.agendamentoId ?? "",
                  },
                });
              }}
            >
              <View style={{ backgroundColor: "#0A6475", borderRadius: 8, paddingVertical: 12, marginTop: 18 }}>
                <Text bold color="white" align="center">Confirmar</Text>
              </View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback onPress={() => setShowConfirmModal(false)}>
              <Text align="center" color="primary" style={{ marginTop: 10, textDecorationLine: "underline" }}>
                Fechar
              </Text>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </Modal>
    </>
  );
}