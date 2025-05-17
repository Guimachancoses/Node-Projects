import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Box, Title, Text, Button, TextInput, Spacer } from "@/src/styles";
import { Surface, useTheme } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import theme from "@/src/styles/theme.json";
import { upperCase } from "lodash";
import {
  filterAgenda,
  updateAgendamento,
  updateForm,
  updateStatusAgendamento,
} from "@/src/store/modules/salao/actions";
import { resetAgendamento } from "@/src/store/modules/cliente/action";
import { router } from "expo-router";

export default function Details() {
  const dispatch = useDispatch();
  const { dark } = useTheme();
  const isDarkMode = dark;
  const dynamicTextColor = isDarkMode ? "light" : "dark";

  const [observacoes, setObservacoes] = useState("");
  const { servicos, salao } = useSelector((state: any) => state.salao);
  const { cliente, agendamento } = useSelector((state: any) => state.cliente);

  const servico = servicos.find((s: any) => s._id === agendamento?.servicoId);

  return (
    <Box direction="column" key={agendamento?._id}>
      <Box hasPadding justify="space-between" width="76%">
        <Box direction="column">
          <Title small color={dynamicTextColor}>
            Cliente
          </Title>
          <Text small bold color={theme.colors.primary} spacing="5px 0 0">
            {cliente?.nome} {cliente?.sobrenome}
          </Text>
        </Box>
        <Surface
          style={{
            padding: 5,
            borderRadius: 5,
            backgroundColor:
              agendamento?.status === "A"
                ? "#e5ffe5"
                : agendamento?.status === "C"
                ? "#ffe5e5"
                : agendamento?.status === "P"
                ? "#e5e5ff"
                : "#e5e5e5",
          }}
        >
          <Text
            small
            bold
            color={
              agendamento?.status === "A"
                ? "green"
                : agendamento?.status === "C"
                ? "red"
                : agendamento?.status === "P"
                ? "blue"
                : "gray"
            }
            spacing="5px 0 0"
          >
            {agendamento?.status === "A"
              ? "Confirmado"
              : agendamento?.status === "C"
              ? "Cancelado"
              : agendamento?.status === "P"
              ? "Pendente"
              : "Finalizado"}
          </Text>
        </Surface>
      </Box>

      <Box hasPadding direction="column" removePaddingTop>
        <Title small color={dynamicTextColor}>
          Local
        </Title>
        <Text small bold color={theme.colors.primary} spacing="5px 0 0">
          {upperCase(salao?.nome)}
        </Text>
        <Text small color={dynamicTextColor} spacing="5px 0 0">
          {salao?.endereco.logradouro}, {salao?.endereco.numero} -{" "}
          {salao?.endereco.bairro}, {salao?.endereco.uf}
        </Text>
      </Box>

      <Box hasPadding direction="column" removePaddingTop>
        <Title small color={dynamicTextColor}>
          Data e hora
        </Title>
        <Text small bold color={theme.colors.primary} spacing="5px 0 0">
          {moment(agendamento?.data)
            .tz("America/Sao_Paulo")
            .format("DD/MM/YYYY")}{" "}
          às {moment(agendamento?.data).tz("America/Sao_Paulo").format("HH:mm")}
        </Text>
      </Box>

      <Box hasPadding direction="column" removePaddingTop>
        <Title small color={dynamicTextColor}>
          Contato
        </Title>
        <Text small bold color={theme.colors.primary} spacing="5px 0 0">
          {salao?.telefone?.replace(
            /(\+55)(\d{2})(\d{5})(\d{4})/,
            "($2) $3-$4"
          )}
        </Text>
      </Box>

      <Box hasPadding direction="column" removePaddingTop>
        <Title small color={dynamicTextColor}>
          Serviço(s)
        </Title>
        <Box justify="space-between" align="center" width="90%">
          <Text small bold color={theme.colors.primary}>
            {servico?.titulo}
          </Text>
          <Text small bold color={dynamicTextColor}>
            R$ {servico?.preco},00
          </Text>
        </Box>
      </Box>

      {agendamento.desconto && (
        <Box
          hasPadding
          justify="space-between"
          align="center"
          width="91%"
          removePaddingTop
          removePaddingBottom
          spacing="5px 0"
        >
          <Title small color={dynamicTextColor}>
            Descontos
          </Title>
          <Text small bold color="green" spacing="5px 0">
            - R$ {agendamento?.desconto},00
          </Text>
        </Box>
      )}

      <Box
        hasPadding
        justify="space-between"
        align="center"
        width="91%"
        removePaddingTop
      >
        <Title small color={dynamicTextColor}>
          Total
        </Title>
        <Text small bold color={theme.colors.primary} spacing="5px 0">
          R${" "}
          {agendamento?.desconto
            ? servico?.preco - agendamento?.desconto
            : servico?.preco}
          ,00
        </Text>
      </Box>

      <Box hasPadding justify="space-between" width="76%" removePaddingTop>
        <Box direction="column">
          <Title small color={dynamicTextColor}>
            Pagamento
          </Title>
        </Box>
        <Surface
          style={{
            padding: 5,
            borderRadius: 5,
            backgroundColor:
              agendamento?.statusPagamento === "S"
                ? "#e5ffe5"
                : agendamento?.statusPagamento === "P"
                ? "#e5e5ff"
                : agendamento?.statusPagamento === "E"
                ? "#ffe5e5"
                : "#e5e5e5",
          }}
        >
          <Text
            small
            bold
            color={
              agendamento?.statusPagamento === "S"
                ? "green"
                : agendamento?.statusPagamento === "P"
                ? "blue"
                : agendamento?.statusPagamento === "E"
                ? "red"
                : "gray"
            }
            spacing="5px 0 0"
          >
            {agendamento?.status === "A"
              ? "Confirmado"
              : agendamento?.status === "C"
              ? "Cancelado"
              : agendamento?.status === "P"
              ? "Pendente"
              : "Finalizado"}
          </Text>
        </Surface>
      </Box>

      <Box
        hasPadding
        direction="column"
        width="90%"
        removePaddingTop
        removePaddingBottom
      >
        <Title small color={dynamicTextColor}>
          Observações:
        </Title>
        <TextInput
          mode="outlined"
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          numberOfLines={10}
          maxLength={300}
          style={styles.input}
        />
      </Box>

      <View
        style={{
          padding: 20,
          width: "100%",
          height: "auto",
          marginTop:
            agendamento?.status === "C"
              ? 40
              : moment(agendamento?.data).isAfter(moment())
              ? 0
              : 0,
        }}
      >
        <Button
          icon={
            agendamento?.status === "C"
              ? "calendar-clock"
              : moment(agendamento?.data).isAfter(moment())
              ? "check"
              : "calendar-clock"
          }
          background="primary"
          mode="contained"
          block
          onPress={() => {
            if (moment(agendamento?.data).isAfter(moment())) {
              // Confirmar presença
              dispatch(updateStatusAgendamento("A"));
            } else {
              dispatch(resetAgendamento()); // limpa agendamento anterior
              router.replace("/(home)/home");

              setTimeout(() => {
                dispatch(updateAgendamento({ servicoId: servico?._id }));
                dispatch(updateForm({ buttomSheetDt: 0 })); // força abrir a modal
                dispatch(filterAgenda());
              }, 500); // meio segundo de atraso após a navegação
            }
          }}
        >
          {agendamento?.status === "C"
            ? "Reagendar"
            : moment(agendamento?.data).isAfter(moment())
            ? "Confirmar presença"
            : "Agendar novamente"}
        </Button>

        {
          (agendamento?.status === "P" || agendamento?.status === "A") && (
            <>
              <Spacer size="20px" />
              <Button
                icon="close"
                background="danger"
                mode="contained"
                block
                onPress={() => {
                    dispatch(updateStatusAgendamento("C"));
                }}
              >
                Cancelar agendamento
              </Button>
            </>
          )}
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "transparent",
    marginTop: 5,
  },
});
