import moment from "moment";
import consts from "@/src/constants/consts";
import { Box, Title, Cover, Spacer, Text } from "@/src/styles";
import React from "react";
import { useTheme } from "react-native-paper"; // ← importa o hook do tema

interface ResumeProps {
  servico: any;
}

export default function Resume({ servico }: ResumeProps) {
  const { colors } = useTheme(); // ← acessa o tema atual

  return (
    <Box align="center" hasPadding background={colors.background}>
      <Cover
        width={80}
        height={80}
        image={{
          uri: `${consts?.bucketUrl}/${servico?.arquivos?.[0]?.caminho}`,
        }}
      />
      <Box direction="column" spacing="0 10px 0">
        <Title small color={colors.onSurface}>
          {servico?.titulo}
        </Title>
        <Spacer size="4px" />
        <Text small color={colors.onSurface}>
          Total: R$ {servico?.preco}.00 •{" "}
          {moment(servico?.duracao).format("HH:mm")} min
        </Text>
      </Box>
    </Box>
  );
}
