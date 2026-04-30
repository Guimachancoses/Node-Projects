import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { TouchableWithoutFeedback, Dimensions, StyleSheet, View, TransformsStyle } from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetHandleProps,
} from "@gorhom/bottom-sheet";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { ScrollView } from "react-native-gesture-handler";
import { toRad } from "react-native-redash";
import { useSelector, useDispatch } from "react-redux";
import { ActivityIndicator, useTheme } from "react-native-paper";
import moment from "moment";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { openAuthSessionAsync } from "expo-web-browser";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";

import HeaderModal from "./HeaderModal";
import Resume from "@/Agendamento/Resume";
import DateTime from "./DateTime";
import Especialistas from "./Especialistas";
import ModalEspci from "./ModalEspci";
import CardComp from "./CardComp";
import { Button, Box, Title, Text } from "../../styles";
import util from "../../constants/util";
import {
  createMercadoPagoCheckout,
  resetAgendamento,
  saveAgendamento,
  updateAgendamento,
  updateForm,
} from "../../store/modules/salao/actions";
import theme from "@/src/styles/theme.json";
import ComoPagar from "./ComoPagar";

const mercadoPagoKey =
  (Constants.expoConfig?.extra?.PUBLIC_MERCADO_PAGO_PUBLIC_KEY as string) || "";

// Função para manipular a origem da transformação
export const transformOrigin = (
  { x, y }: { x: number; y: number },
  ...transformations: any[]
) => {
  "worklet";
  return [
    { translateX: x },
    { translateY: y },
    ...transformations,
    { translateX: x * -1 },
    { translateY: y * -1 },
  ];
};

// Handle customizado
const Handle: React.FC<BottomSheetHandleProps> = ({ animatedIndex }) => {
  const indicatorTransformOriginY = useDerivedValue(() =>
    interpolate(animatedIndex.value, [0, 1, 2], [-1, 0, 1], Extrapolate.CLAMP)
  );

  const leftIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const leftIndicatorRotate = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [toRad(-30), 0, toRad(30)],
      Extrapolate.CLAMP
    );
    return {
      transform: transformOrigin(
        { x: 0, y: indicatorTransformOriginY.value },
        { rotate: `${leftIndicatorRotate}rad` },
        { translateX: -5 }
      ),
    };
  });

  const rightIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const rightIndicatorRotate = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [toRad(30), 0, toRad(-30)],
      Extrapolate.CLAMP
    );
    return {
      transform: transformOrigin(
        { x: 0, y: indicatorTransformOriginY.value },
        { rotate: `${rightIndicatorRotate}rad` },
        { translateX: 5 }
      ),
    };
  });

  return (
    <Animated.View style={styles.header}>
      <Animated.View
        style={[styles.indicator, styles.leftIndicator, leftIndicatorAnimatedStyle]}
      />
      <Animated.View
        style={[styles.indicator, styles.rightIndicator, rightIndicatorAnimatedStyle]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    margin: 0,
  },
  indicator: {
    position: "absolute",
    width: 10,
    height: 4,
    backgroundColor: "#999",
  },
  leftIndicator: {
    borderTopStartRadius: 2,
    borderBottomStartRadius: 2,
  },
  rightIndicator: {
    borderTopEndRadius: 2,
    borderBottomEndRadius: 2,
  },
  headerContainer: {
    padding: 20,
    width: "100%",
    height: "auto",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});

export default function AgendamentoBottomS() {
  const dispatch = useDispatch();
  const { form, agendamento, servicos, agenda, colaboradores, link } = useSelector(
    (state: any) => state.salao
  );

  const [headerHeight, setHeaderHeight] = React.useState(70);
  const HANDLE_HEIGHT = 78;

  const snapPoints = useMemo(() => {
    const collapsed = Math.ceil(headerHeight + HANDLE_HEIGHT); // altura real da HeaderModal
    const full = Dimensions.get("screen").height - 120;

    if (form.buttonCard) return [collapsed, 455, full];
    return [collapsed, full];
  }, [headerHeight, form.buttonCard]);

  const { cliente } = useSelector((state: any) => state.cliente);

  const preferenciaPagamento = cliente?.prefPagamento;
  const { colors } = useTheme();
  const dataSelecionada = moment(agendamento?.data).format("YYYY-MM-DD");
  const horaSelecionada = moment(agendamento?.data).format("HH:mm");
  const { horariosDisponiveis, colaboradoresDia } = util.selectAgendamento(
    agenda,
    dataSelecionada as any,
    agendamento?.colaboradorId
  );
  const servico = servicos.find((s: any) => s._id === agendamento?.servicoId);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // const snapPoints = useMemo(() => {
  //   if (form.buttonCard) return [455];
  //   return [94, Dimensions.get("screen").height - 120];
  // }, [form.buttonCard, form.modalAgendamento]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        dispatch(resetAgendamento());
        dispatch(updateForm({ modalAgendamento: false, buttonCard: false }));
      }
    },
    [dispatch]
  );

  useFocusEffect(
    React.useCallback(() => {
      if (agendamento?.servicoId) {
        bottomSheetRef.current?.snapToIndex(0); // começa colapsado no header
      }
    }, [agendamento?.servicoId])
  );

  useEffect(() => {
    if (form?.modalAgendamento) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [form?.modalAgendamento]);

  const agendamentoInvalido =
    !agendamento?.data || !agendamento?.colaboradorId || !agendamento?.servicoId;

  useEffect(() => {
    if (mercadoPagoKey) {
      initMercadoPago(mercadoPagoKey);
    }
  }, []);

  useEffect(() => {
    const openSession = async () => {
      if (link) {
        await openAuthSessionAsync(link, "parrudus-app://");
      }
    };
    openSession();
  }, [link]);

  const signIn = async () => {
    if (link) return;
    if (!form.saveAgendamento) return;

    dispatch(
      createMercadoPagoCheckout({
        id: servico?._id,
        title: servico?.titulo,
        preco: servico?.preco,
        userEmail: cliente?.email,
      })
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      handleComponent={Handle}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: "hidden",
      }}
    >
      <BottomSheetView style={{ flex: 1, backgroundColor: colors.background }}>
      <HeaderModal
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== headerHeight) setHeaderHeight(h);
        }}
      />
        <ScrollView >
          {form.buttonCard === true ? (
            <ComoPagar />
          ) : agenda.length === 0 ? (
            <>
              <Resume servico={servico} />
              <Box
                height={`${Dimensions.get("window").height - 350}px`}
                direction="column"
                hasPadding
                justify="center"
                align="center"
              >
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Title align="center">Só um instante...</Title>
                <Text small align="center">
                  Estamos buscando o melhor horário para você...
                </Text>
              </Box>
            </>
          ) : (
            <>
              <Resume servico={servico} />
              <DateTime
                servico={servico}
                agenda={agenda}
                dataSelecionada={dataSelecionada}
                horaSelecionada={horaSelecionada}
                horarioDisponiveis={horariosDisponiveis}
              />
              <Especialistas colaboradores={colaboradores} agendamento={agendamento} />

              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <CardComp
                  preferenciaPagamento={preferenciaPagamento}
                  onPress={() => {
                    dispatch(updateForm({ buttonCard: true }));
                    setTimeout(() => {
                      bottomSheetRef.current?.snapToIndex(1);
                    }, 100);
                  }}
                />
              </TouchableWithoutFeedback>

              <View style={{ padding: 20, width: "100%", height: "auto" }}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <Button
                    loading={form.agendamentoLoading}
                    disabled={agendamentoInvalido}
                    icon="check"
                    background="primary"
                    mode="contained"
                    block
                    uppercase={false}
                    onPress={() => {
                      dispatch(updateAgendamento({ clienteId: cliente?.clienteId }));
                      if (preferenciaPagamento === "M") {
                        dispatch(saveAgendamento());
                        signIn();
                      } else {
                        dispatch(saveAgendamento());
                      }
                      dispatch(updateForm({ buttonCard: false }));
                    }}
                  >
                    Confirmar meu agendamento
                  </Button>
                </TouchableWithoutFeedback>
              </View>
            </>
          )}
        </ScrollView>

        <ModalEspci
          form={form}
          colaboradores={colaboradores}
          agendamento={agendamento}
          servicos={servicos}
          horaSelecionada={horaSelecionada}
          colaboradoresDia={colaboradoresDia}
        />
      </BottomSheetView>

    </BottomSheet>
  );
}