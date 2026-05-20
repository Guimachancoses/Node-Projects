import moment from "moment";
import React from "react";
import { Modal, Portal, useTheme } from "react-native-paper";
import theme from "@/src/styles/theme.json";
import { ScrollView } from "react-native-gesture-handler";
import { Dimensions } from "react-native";
import { useDispatch } from "react-redux";
import Logo from "@/src/assets/images/Logo.png";
import consts from "@/src/constants/consts";

import { Text, Box, Touchable, Cover } from "../../styles";
import {
  updateForm,
  updateAgendamento,
} from "../../store/modules/salao/actions";

interface ModalEspciProps {
  form: any; // Ideal: tipar melhor esse objeto
  colaboradores: any;
  agendamento: any;
  servicos: any;
  horaSelecionada: any;
  colaboradoresDia: any;
}

export default function ModalEspci({
  form,
  colaboradores,
  agendamento,
  servicos,
  horaSelecionada,
  colaboradoresDia,
}: ModalEspciProps) {
  const dispatch = useDispatch();
  const colaboradoresIdsDisponiveis = [] as any;
  const { colors, dark } = useTheme();
  const isDarkMode = dark;
  const dynamicTextColor = isDarkMode ? "light" : "dark";
  for (let colaboradorId of Object.keys(colaboradoresDia)) {
    let horarios = colaboradoresDia[colaboradorId]?.flat(2);
    if (horarios?.includes(horaSelecionada)) {
      colaboradoresIdsDisponiveis.push(colaboradorId);
    }
  }

  const colaboradoresDisponiveis = colaboradores?.filter((c: any) =>
    colaboradoresIdsDisponiveis?.includes(c._id)
  );

  const servico = servicos?.find((s: any) => s._id === agendamento?.servicoId);

  const containerStyle = { backgroundColor: colors.background, padding: 20, margin: 20 };

  const getImage = (foto: any) => {
    if (!foto) return Logo;

    const raw = String(foto).trim();

    if (
      raw === "" ||
      raw.toLowerCase() === "null" ||
      raw.toLowerCase() === "undefined"
    ) {
      return Logo;
    }

    // Se já vier URL completa, usa direto
    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    // Se vier caminho do bucket, monta a URL completa
    const bucketUrl = consts.bucketUrl.replace(/\/$/, "");
    const path = raw.replace(/^\//, "");

    return `${bucketUrl}/${path}`;
  };

  return (
    <>
      <Portal>
        <Modal
          visible={form?.modalEspecialista}
          onDismiss={() => dispatch(updateForm({ modalEspecialista: false }))}
          contentContainerStyle={containerStyle}
        >
          <ScrollView>
            <Box hasPadding direction="column" removePaddingTop>
              <Text bold color={dynamicTextColor} spacing="0 10px 5px">
                {servico?.titulo}
              </Text>
              <Text small color={dynamicTextColor} spacing="0 10px 0">
                Disponivéis em{" "}
                {`${moment(agendamento?.data).format("DD/MM/YYYY [às] HH:mm")}`}
              </Text>
              <Box wrap="wrap" spacing="10px 0 0">
                {colaboradoresDisponiveis?.map((colaborador: any) => (

                  <Touchable
                    key={colaborador._id}
                    width={`${(Dimensions.get("screen").width - 120) / 4}px`}
                    height="70px"
                    spacing="15px 0px 0px 0px"
                    direction="column"
                    align="center"
                    onPress={() => {
                      dispatch(
                        updateAgendamento({ colaboradorId: colaborador?._id })
                      );
                      dispatch(updateForm({ modalEspecialista: false }));
                    }}
                  >
                    <Box
                      width={53}
                      height="53px"
                      radius={27}
                      align="center"
                      justify="center"
                      border={
                        colaborador._id === agendamento.colaboradorId
                          ? `4px solid ${theme.colors.primary}`
                          : "4px solid transparent"
                      }
                    >
                      <Cover
                        image={getImage(colaborador?.foto)}
                        customWidth={45}
                        customHeight={45}
                        resizeMode="cover"
                        circle
                      />
                    </Box>


                    <Text small bold color={dynamicTextColor}>
                      {colaborador.nome}
                    </Text>
                  </Touchable>
                ))}
              </Box>
            </Box>
          </ScrollView>
        </Modal>
      </Portal>
    </>
  );
}
