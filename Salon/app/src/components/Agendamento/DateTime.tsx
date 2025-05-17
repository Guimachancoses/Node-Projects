import React, { useState } from "react";
import { FlatList } from "react-native-gesture-handler";
import moment from "moment";
import { useDispatch } from "react-redux";

import { Box, Text, Title, Touchable } from "@/src/styles";
import util from "@/src/constants/util";
import theme from "@/src/styles/theme.json";
import {
  updateAgendamento,
  filterAgenda,
} from "@/src/store/modules/salao/actions";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

interface DateTimeProps {
  servico: any;
  agenda: any;
  dataSelecionada: any;
  horaSelecionada: any;
  horarioDisponiveis: any;
}

export default function DateTime({
  servico,
  agenda,
  dataSelecionada,
  horaSelecionada,
  horarioDisponiveis,
}: DateTimeProps) {
  const dispatch = useDispatch();
  const [loadingMore, setLoadingMore] = useState(false);
  const { colors, dark } = useTheme();

  const isDarkMode = dark;

  const dynamicTextColor = isDarkMode ? "light" : "dark";

  const setAgendamento = (value: any, isTime: any) => {
    const { horariosDisponiveis } = util.selectAgendamento(
      agenda,
      isTime ? dataSelecionada : value
    );
    //console.log("horariosDisponiveisSete: ", horariosDisponiveis);
    let dataFinal = !isTime
      ? `${value}T${horariosDisponiveis[0][0]}`
      : `${dataSelecionada}T${value}`;
    dispatch(updateAgendamento({ data: dataFinal }));
  };

  const loadMoreDates = async () => {
    if (loadingMore || agenda.length === 0) return;

    setLoadingMore(true);

    // Pega a última data exibida atualmente na lista
    const ultimoDia = Object.keys(agenda[agenda.length - 1])[0];

    // Dispara a saga que busca mais dias com base nessa data
    dispatch(filterAgenda(ultimoDia));

    setTimeout(() => setLoadingMore(false), 1000); // simula delay
  };

  // console.log("dataSelecionada: ", dataSelecionada);
  // console.log("horaSelecionada: ", horaSelecionada);
  // console.log("Horarios disponiveis em DAtetime: ", horarioDisponiveis);

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text bold color={dynamicTextColor} hasPadding>
        Para quando você gostaria de agendar?
      </Text>

      <FlatList
        data={agenda}
        horizontal
        contentContainerStyle={{ paddingLeft: 20 }}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => Object.keys(item)[0]}
        renderItem={({ item }) => {
          const date = moment(Object.keys(item)[0]);
          const dateISO = moment(date).format("YYYY-MM-DD");
          ////console.log("dataSelecionada: ", dataSelecionada)
          const selected = dataSelecionada
            ? dateISO === dataSelecionada
            : agenda[0] && Object.keys(agenda[0])[0] === dateISO;

          return (
            <Touchable
              key={dateISO}
              width="70px"
              height="80px"
              spacing="0 10px 0 0"
              rounded="10px"
              direction="column"
              justify="center"
              align="center"
              border={`1px solid ${
                selected
                  ? theme.colors.primary
                  : util.toAlpha(theme.colors.muted, 20)
              }`}
              background={selected ? "primary" : "light"}
              onPress={() => setAgendamento(dateISO, false)}
            >
              <Text small color={selected ? "light" : undefined}>
                {util.diasSemana[date.day()]}
              </Text>
              <Title small color={selected ? "light" : undefined}>
                {date.format("DD")}
              </Title>
              <Text small color={selected ? "light" : undefined}>
                {util.diasMes[date.month()]}
              </Text>
            </Touchable>
          );
        }}
        onEndReached={loadMoreDates}
        onEndReachedThreshold={0.5}
      />
      <Text bold color={dynamicTextColor} hasPadding>
        Qual o horário deseja?
      </Text>
      <FlatList
        data={horarioDisponiveis}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }}
        keyExtractor={(item, index) => `data-${index}-${Object.keys(item)[0]}`}
        renderItem={({ item, index }) => (
          <Box direction="column" spacing="0 10px 0 0" width="100px">
            {item.map((horario: any, i: number) => {
              // Converter a duração do serviço em minutos
              //console.log(`servico?.duracao: ${servico?.duracao}`)
              const duracaoMinutos = moment(servico?.duracao).diff(
                moment(servico?.duracao).clone().startOf("day"),
                "minutes"
              );
              //console.log('duracaoMinutos: ', duracaoMinutos)
              // Calcular quantos slots de 30min são necessários
              const slotsSelecionados = Math.ceil(duracaoMinutos / 30) || 1;
              const blocosVisuais = slotsSelecionados + 1;
              //console.log('slotsSelecionados: ', slotsSelecionados)
              // Gerar os horários que devem ficar com o estilo 'selected'
              const horariosSelecionados = [];
              if (horaSelecionada) {
                const baseTime = moment(
                  `${dataSelecionada}T${horaSelecionada}`
                );
                for (let j = 0; j < blocosVisuais; j++) {
                  horariosSelecionados.push(
                    baseTime
                      .clone()
                      .add(j * 30, "minutes")
                      .format("HH:mm")
                  );
                }
                //console.log('horaSelecionada: ', horaSelecionada)
                //console.log('horariosSelecionados: ', horariosSelecionados)
                //console.log('baseTime: ', baseTime)
              }

              // Verifica se o horário atual está na lista de selecionados
              const selected = horariosSelecionados.includes(horario);
              //console.log('selected: ', selected)

              return (
                <Touchable
                  key={`${index}-${i}-${horario}`}
                  width="100px"
                  height="35px"
                  spacing="0 10px 5px 0"
                  background={selected ? "primary" : "light"}
                  rounded="7px"
                  justify="center"
                  align="center"
                  border={`1px solid ${
                    selected
                      ? theme.colors.primary
                      : util.toAlpha(theme.colors.muted, 20)
                  }`}
                  onPress={() => setAgendamento(horario, true)}
                >
                  <Text small color={selected ? "light" : undefined}>
                    {horario}
                  </Text>
                </Touchable>
              );
            })}
          </Box>
        )}
      />
    </View>
  );
}
