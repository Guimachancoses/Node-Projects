import React from "react";
import { useDispatch } from "react-redux";
import { View } from "react-native";

import { Box, Text, Title, Button, Spacer } from "@/src/styles";
import { updateForm } from "@/src/store/modules/salao/actions";
import ButtonInput from "@/src/components/Login/ButtonInput";
import { useTheme } from "react-native-paper";
import { updateCliente } from "@/src/store/modules/cliente/action";

export default function ComoPagar() {
  const dispatch = useDispatch();
  const { colors, dark } = useTheme();
  const isDarkMode = dark;
  const dynamicTextColor = isDarkMode ? "light" : "dark";

  return (
    <>
      <Box justify="flex-start" hasPadding direction="column">
        <Box align="flex-start" height="40px" direction="column">
          <Title color={dynamicTextColor}>Escolher como pagar?</Title>
          <Text color={dynamicTextColor}>Defina a sua preferência:</Text>
        </Box>
      </Box>

      <Box
        hasPadding
        width="90%"
        spacing="0 20px 0"
        align="center"
        justify="center"
        direction="column"
        removePaddingBottom
      >
        <ButtonInput
          color="light"
          background="dark"
          border="dark"
          imageUri={
            "https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png"
          }
          text="Pagar com o Mercado Pago"
          onPress={() => {
            dispatch(updateCliente({ prefPagamento: "M" }));
            dispatch(updateForm({ buttonCard: false }));
            
          }}
        />
        <Spacer size="5px" />
        <Text small color={dynamicTextColor}>
          Pague com segurança
        </Text>
      </Box>

      <Box
        hasPadding
        width="90%"
        spacing="0 20px 0"
        align="center"
        justify="center"
        direction="column"
      >
        <ButtonInput
          border="muted"
          imageUri="https://cdn-icons-png.flaticon.com/512/2534/2534191.png"
          text="Pagamento no local"
          onPress={() => {
            dispatch(updateCliente({ prefPagamento: "L" }));
            dispatch(updateForm({ buttonCard: false }));
          }}
        />
      </Box>
    </>
  );
}
