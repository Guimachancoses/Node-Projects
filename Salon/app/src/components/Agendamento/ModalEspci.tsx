import moment from "moment";
import React from "react";
import { Modal, Portal } from "react-native-paper";
import theme from "@/src/styles/theme.json";
import { ScrollView } from "react-native-gesture-handler";
import { Dimensions } from "react-native";
import { useDispatch } from "react-redux";

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

  for (let colaboradorId of Object.keys(colaboradoresDia)) {
    let horarios = colaboradoresDia[colaboradorId]?.flat(2);
    if (horarios?.includes(horaSelecionada)) {
      colaboradoresIdsDisponiveis.push(colaboradorId);
    }
  }

  const colaboradoresDisponiveis = colaboradores?.filter((c: any) =>
    colaboradoresIdsDisponiveis?.includes(c._id)
  );

  const servico = servicos?.find((s: any) => s._id === agendamento?.serviId);

  const containerStyle = { backgroundColor: "white", padding: 20, margin: 20 };

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
              <Text bold color="dark" spacing="0 10px 5px">
                {servico?.titulo}
              </Text>
              <Text small spacing="0 10px 0">
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
                    <Cover
                      image={colaborador?.foto}
                      height={45}
                      width={45}
                      circle
                      border={
                        colaborador._id === agendamento.colaboradorId
                          ? `4px solid ${theme.colors.primary}`
                          : "none"
                      }
                      spacing="0 0 6px"
                    />
                    <Text small bold>
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
