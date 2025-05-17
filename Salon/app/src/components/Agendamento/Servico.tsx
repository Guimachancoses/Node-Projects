import moment from "moment";
import { Text, Box, Touchable, Cover, Spacer, Button } from "@/src/styles";
import React from "react";
import consts from "@/src/constants/consts";
import { useDispatch } from "react-redux";
import { filterAgenda, updateAgendamento } from "@/src/store/modules/salao/actions";
import { useTheme } from "react-native-paper";

interface ServicoProps {
  servico: any; // Ideal: tipar melhor esse objeto
}

export default function Servico({ servico }: ServicoProps) {
  const dispatch = useDispatch();
  const { colors } = useTheme(); // <- pega cores do tema atual (claro/escuro)

  return (
    <Box
      width="70%"
      hasPadding
      spacing="10px 0"
      direction="row"
    >
      <Cover
        spacing="0 5px 0 0"
        image={{
          uri: `${consts?.bucketUrl}/${servico?.arquivos?.[0]?.caminho}`,
        }}
      />
      <Box direction="column" width="50%">
        <Text bold color={colors.onSurface}> {/* <- cor adaptada */}
          {servico?.titulo}
        </Text>
        <Spacer size="5px"/>
        <Text small color={colors.onSurface}> {/* <- cor adaptada */}
          R$ {servico?.preco},00 • {moment(servico?.duracao).format("HH:mm")} min
        </Text>
      </Box>
      <Box justify="center" align="center">
        <Touchable
          onPress={() => {
            dispatch(updateAgendamento({ servicoId: servico?._id }));
            dispatch(filterAgenda());
          }}
        >
          <Button
            icon="clock-check-outline"
            background="primary"
            mode="contained"
          >
            Agendar
          </Button>
        </Touchable>
      </Box>
    </Box>
  );
}
