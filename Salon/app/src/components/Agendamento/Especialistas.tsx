import React from "react";
import { useDispatch } from "react-redux";
import { useTheme } from "react-native-paper";

import { Box, Text, Cover, Button, Touchable } from "@/src/styles";
import theme from "@/src/styles/theme.json";
import util from "@/src/constants/util";
import { updateForm } from "@/src/store/modules/salao/actions";
import { View } from "react-native";
import Logo from "@/src/assets/images/Logo.png";

interface EspecialistaProps {
  colaboradores: any;
  agendamento: any;
}

export default function Especialistas({ colaboradores, agendamento }: EspecialistaProps) {
  const dispatch = useDispatch();
  const { colors, dark } = useTheme();

  const isDarkMode = dark;

  const dynamicTextColor = isDarkMode ? "light" : "dark";

  const colaborador = colaboradores?.find(
    (c: any) => c._id === agendamento?.colaboradorId
  );

  const imageSource = colaborador?.foto
  ? { uri: colaborador.foto }
  : Logo;

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text hasPadding bold color={dynamicTextColor} removePaddingBottom>
        Gostaria de trocar o profissional?
      </Text>
      <Box hasPadding removePaddingBottom>
        <Box width="60%" align="center">
          <Cover
            customWidth={60}
            customHeight={60}
            resizeMode="cover"
            circle
            image={imageSource}
          />
          <Text small color={dynamicTextColor} spacing="0 10px 0">
            {`${colaborador?.nome} ${colaborador?.sobrenome}`}
          </Text>
        </Box>
        <Box align="center" spacing="5px 0 0">
          <Touchable>
            <Button
              disabled={agendamento?.data === null}
              uppercase={false}
              textColor="light"
              background={util.toAlpha(theme.colors.primary, 95)}
              mode="contained"
              block
              onPress={() =>
                dispatch(updateForm({ modalEspecialista: true }))
              }
            >
              Trocar Profissinal
            </Button>
          </Touchable>
        </Box>
      </Box>
    </View>
  );
}
