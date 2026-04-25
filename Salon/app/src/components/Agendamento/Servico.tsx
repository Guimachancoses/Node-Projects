import React, { useState } from "react";
import moment from "moment";
import {
  Modal,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { useDispatch } from "react-redux";
import { useTheme } from "react-native-paper";

import { Text, Box, Touchable, Cover, Spacer, Button } from "@/src/styles";
import consts from "@/src/constants/consts";
import { filterAgenda, updateAgendamento } from "@/src/store/modules/salao/actions";
import CardContent from "../Show/CardContent";

interface ServicoProps {
  servico: any; // TODO: tipar corretamente
}

export default function Servico({ servico }: ServicoProps) {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handleAgendar = () => {
    dispatch(updateAgendamento({ servicoId: servico?._id }));
    dispatch(filterAgenda());
  };

  return (
    <>
      <Box width="70%" hasPadding spacing="10px 0" direction="row">
        <Pressable onPress={() => setModalVisible(true)}>
          <Cover
            resizeMode="stretch"
            spacing="0 5px 0 0"
            image={{
              uri: `${consts?.bucketUrl}/${servico?.arquivos?.[0]?.caminho}`,
            }}
          />
        </Pressable>

        <Box direction="column" width="50%">
          <Text bold color={colors.onSurface}>
            {servico?.titulo}
          </Text>
          <Spacer size="5px" />
          <Text small color={colors.onSurface}>
            R$ {servico?.preco},00 • {moment(servico?.duracao).format("HH:mm")} min
          </Text>
        </Box>

        <Box justify="center" align="center">
          <Touchable onPress={handleAgendar}>
            <Button icon="clock-check-outline" background="primary" mode="contained">
              Agendar
            </Button>
          </Touchable>
        </Box>
      </Box>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.backdrop}>
            <Pressable style={styles.modalContent}>
              <CardContent servico={servico} />
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    minHeight: 200,
    borderRadius: 16,
  },
});