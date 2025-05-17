import React from "react";
import moment from "moment";
import { TouchableWithoutFeedback } from "react-native";
import { Box, Cover, Title, Text, Touchable } from "@/src/styles";
import { Surface, useTheme } from "react-native-paper";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { updateForm } from "@/src/store/modules/salao/actions";
import consts from "@/src/constants/consts";
import { updateAgendamento } from "@/src/store/modules/cliente/action";
interface ServicoProps {
  agendamento: any; // Ideal: tipar melhor esse objeto
  value: string;
}

export default function HitoricoAg({ agendamento, value }: ServicoProps) {
  const dispatch = useDispatch();
  const { servicos } = useSelector((state: any) => state.salao);
  const { dark } = useTheme();
  const isDarkMode = dark;
  const invDynamicTextColor = isDarkMode ? "dark" : "light";
  const dynamicTextColor = isDarkMode ? "light" : "dark";
  const servico = servicos.find((s: any) => s._id === agendamento?.servicoId);

  //console.log("agendamento: ", agendamento);
  const dataComFuso = moment(agendamento?.data).utcOffset(-3);
  const agoraComFuso = moment().utcOffset(-3);

  if (dataComFuso.isAfter(agoraComFuso) && value === "proximos") {
    return (
      <Box
        justify="space-between"
        align="center"
        radius={5}
        hasPadding
        background={invDynamicTextColor}
        spacing="10px 20px 0"
        width="90%"
        height="70px"
        removePaddingBottom
        removePaddingTop
      >
        <Cover
          image={{
            uri: `${consts?.bucketUrl}/${servico?.arquivos?.[0]?.caminho}`,
          }}
          customHeight={60}
          customWidth={60}
        />
        <Box align="center" spacing="0 2px 0">
          <TouchableWithoutFeedback>
            <Touchable
              key={agendamento?._id}
              onPress={() => {
                dispatch(updateForm({ buttomSheetDt: 2 }));
                dispatch(updateAgendamento(agendamento));
              }}
            >
              <Box
                hasPadding
                removePaddingTop
                spacing="20px 0 0"
                direction="column"
                width="55%"
                align="center"
              >
                <Title small color={dynamicTextColor}>
                  {servico?.titulo}
                </Title>
                <Text small color={dynamicTextColor}>
                  Dia {moment(agendamento?.data).format("DD/MM/YYYY")} às{" "}
                  {moment(agendamento?.data).format("HH:mm")}
                </Text>
              </Box>
              <Box width="50%" spacing="25px 0 0">
                <Surface
                  style={{
                    ...styles.surface,
                    backgroundColor:
                      agendamento?.statusPagamento === "S"
                        ? "#e5ffe5"
                        : "#ffe5e5",
                    borderColor:
                      agendamento?.statusPagamento === "S" ? "green" : "red",
                  }}
                  elevation={4}
                >
                  <Text
                    style={{
                      ...styles.pago,
                      color:
                        agendamento?.statusPagamento === "S" ? "green" : "red",
                    }}
                    small
                  >
                    {agendamento?.statusPagamento === "S" ? "Pago" : "Pendente"}
                  </Text>
                </Surface>
              </Box>
            </Touchable>
          </TouchableWithoutFeedback>
        </Box>
      </Box>
    );
  } else if (
    dataComFuso.isBefore(agoraComFuso) &&
    value === "anteriores"
  ) {
    return (
      <Box
        justify="space-between"
        align="center"
        radius={5}
        hasPadding
        background={invDynamicTextColor}
        spacing="10px 20px 0"
        width="90%"
        height="70px"
        removePaddingBottom
        removePaddingTop
      >
        <Cover
          image={{
            uri: `${consts?.bucketUrl}/${servico?.arquivos?.[0]?.caminho}`,
          }}
          customHeight={60}
          customWidth={60}
        />
        <Box align="center" spacing="0 2px 0">
          <TouchableWithoutFeedback>
            <Touchable
              onPress={() => {
                dispatch(updateForm({ buttomSheetDt: 2 }));
                dispatch(updateAgendamento(agendamento));
              }}
            >
              <Box
                hasPadding
                removePaddingTop
                spacing="20px 0 0"
                direction="column"
                width="55%"
                align="center"
              >
                <Title small color={dynamicTextColor}>
                  {servico?.titulo}
                </Title>
                <Text small color={dynamicTextColor}>
                  Dia {moment(agendamento?.data).format("DD/MM/YYYY")} às{" "}
                  {moment(agendamento?.data).format("HH:mm")}
                </Text>
              </Box>
              <Box width="50%" spacing="25px 0 0">
                <Surface
                  style={{
                    ...styles.surface,
                    backgroundColor:
                      agendamento?.statusPagamento === "S"
                        ? "#e5ffe5"
                        : "#ffe5e5",
                    borderColor:
                      agendamento?.statusPagamento === "S" ? "green" : "red",
                  }}
                  elevation={4}
                >
                  <Text
                    style={{
                      ...styles.pago,
                      color:
                        agendamento?.statusPagamento === "S" ? "green" : "red",
                    }}
                    small
                  >
                    {agendamento?.statusPagamento === "S" ? "Pago" : "Pendente"}
                  </Text>
                </Surface>
              </Box>
            </Touchable>
          </TouchableWithoutFeedback>
        </Box>
      </Box>
    );
  }
}

const styles = StyleSheet.create({
  surface: {
    height: 30,
    width: 75,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  pago: {
    fontWeight: "bold",
  },
});
