import React, { useEffect, useState } from "react";
import {
  Title,
  Box,
  Text,
  Touchable,
  TextInput,
  Spacer,
} from "@/src/styles";
import { useTheme } from "react-native-paper"; // ← aqui
import { Linking, Share } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  updateForm,
  updateTipoServicos,
  updateTypeChoice,
} from "@/src/store/modules/salao/actions";
import MaterialCommunityIcons from "./MCIcon";
import { Button as ButtonPaper } from "react-native-paper";

export default function Header() {
  const dispatch = useDispatch();
  const { salao, servicos } = useSelector((state: any) => state.salao);
  const [selectedTypeService, setSelectedTypeService] = useState("Barbearia");
  const { colors } = useTheme(); // ← aqui pegamos o tema atual

  const iconColor = colors.onSurface;
  const textColor = colors.onSurface;

  const handleTipoSelect = (tipo: string) => {
    dispatch(updateTypeChoice(tipo)); // atualiza a escolha
    const filtrados = servicos.filter((s: any) => s.tipoServico === tipo);
    dispatch(updateTipoServicos(filtrados));
  };

  useEffect(() => {
    handleTipoSelect("Barbearia");
  }, []);

  const countServicosPorTipo = (tipo: string) => {
    return servicos?.filter((s: any) => s.tipoServico === tipo)?.length || 0;
  };

  const WHATSAPP_NUMBER = "5519981955602"; // 55 + DDD + número
  const WHATSAPP_MESSAGE = encodeURIComponent(
    `Olá, tudo bem? Vim pelo app e gostaria de agendar um horário.`
  );

  const handleWhatsAppPress = async () => {
    const appUrl = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${WHATSAPP_MESSAGE}`;
    const webUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

    try {
      // tenta abrir no app
      await Linking.openURL(appUrl);
    } catch {
      // fallback web
      await Linking.openURL(webUrl);
    }
  };

  return (
    <>
      <Box align="center" width="50%">
        <Box hasPadding justify="space-between">
          <Touchable
            width="30px"
            direction="column"
            align="center"
            spacing="0px 10px 0 0"
            onPress={() => Linking.openURL(`tel:${salao?.telefone}`)}
          >
            <MaterialCommunityIcons name="phone" size={24} color={iconColor} />
            <Text small spacing="10px 0 0" color={textColor}>
              Ligar
            </Text>
          </Touchable>

          <Touchable
            width="50px"
            direction="column"
            align="center"
            onPress={() => {
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination=${salao?.geo?.coordinates[0]},${salao?.geo?.coordinates[1]}`
              );
            }}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={24}
              color={iconColor}
            />
            <Text small spacing="10px 0 0" color={textColor}>
              Visitar
            </Text>
          </Touchable>

          <Touchable
            width="50px"
            direction="column"
            align="center"
            onPress={() => Share.share({ message: `${salao?.nome}` })}
          >
            <MaterialCommunityIcons name="share" size={24} color={iconColor} />
            <Text small spacing="10px 0 0" color={textColor}>
              Enviar
            </Text>
          </Touchable>
        </Box>
        <Box hasPadding direction="column" align="center" justify="center">
          <Touchable onPress={handleWhatsAppPress}>
            <ButtonPaper
              mode="contained"
              icon="whatsapp"
              buttonColor="#25D366"
              textColor="#FFFFFF"
              uppercase={false}
              style={{ borderRadius: 10, minWidth: 170 }}
              contentStyle={{ height: 48 }}
            >
              Chamar no WhatsApp
            </ButtonPaper>
          </Touchable>

          <Text small spacing="10px 0 0" color={textColor}>
            Atendimento rápido
          </Text>
        </Box>
      </Box>

      <Box
        hasPadding
        removePaddingBottom
        removePaddingTop
        justify="space-between"
        align="center"
      >
        <Touchable
          onPress={() => {
            handleTipoSelect("Barbearia");
            setSelectedTypeService("Barbearia");
          }}
        >
          <ButtonPaper
            mode={
              selectedTypeService === "Barbearia" ? "contained" : "outlined"
            }
          >
            Barberaria
          </ButtonPaper>
        </Touchable>
        <Touchable
          onPress={() => {
            handleTipoSelect("Cuidados");
            setSelectedTypeService("Cuidados");
          }}
        >
          <ButtonPaper
            mode={selectedTypeService === "Cuidados" ? "contained" : "outlined"}
          >
            Cuidados
          </ButtonPaper>
        </Touchable>
        <Touchable
          onPress={() => {
            handleTipoSelect("Crianças");
            setSelectedTypeService("Crianças");
          }}
        >
          <ButtonPaper
            mode={selectedTypeService === "Crianças" ? "contained" : "outlined"}
          >
            Crianças
          </ButtonPaper>
        </Touchable>
      </Box>

      <Box hasPadding direction="column" spacing="0 0 0">
        <Title small color={textColor}>
          Serviços ({countServicosPorTipo(selectedTypeService)})
        </Title>
        <Spacer size="5px" />
        <TextInput
          placeholder="Digite o nome do serviço..."
          onChangeText={(value) => dispatch(updateForm({ inputFiltro: value }))}
          onFocus={() => dispatch(updateForm({ inputFiltroFoco: true }))}
          onBlur={() => dispatch(updateForm({ inputFiltroFoco: false }))}
        />
      </Box>
    </>
  );
}
