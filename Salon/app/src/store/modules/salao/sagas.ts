import moment from "moment-timezone";
moment.tz.setDefault("America/Sao_Paulo");
import { takeLatest, all, call, put, select } from "redux-saga/effects";
import Toast from "react-native-toast-message";

import types from "./types";
import util from "@/src/constants/util";
import api from "@/src/services/api";
import {
  updateSalao,
  updateServicos, 
  updateAgenda,
  updateAgendamento,
  updateColaboradores,
  updateForm,
  referenceLink,
  resetAgendamento,
} from "./actions";

import { updateAgendamento as updateAgendamentoCliente } from "@/src/store/modules/cliente/action";
import { router } from "expo-router";
import Constants from "expo-constants";

const SALAOID = Constants.expoConfig?.extra?.EXPO_SALAO_ID;

//console.log("SALAOID: ", SALAOID);

// Função que busca o salao
export function* getSalao() {
  try {
    const { data: res } = yield call(api.get, `/salao/${SALAOID}`);
    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    //console.log("Resposta completa da API:", res);

    yield put(updateSalao(res.salao));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
  }
}

// Função que busca todos os serviços
export function* allServicos() {
  try {
    const { data: res } = yield call(api.get, `/servico/salao/${SALAOID}`);
    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    //console.log("Resposta completa da API:", res);

    yield put(updateServicos(res.servicos));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
  }
}

// // Função para filtrar a agenda
export function* filterAgenda({ payload }: any) {

  try {
    const { agendamento, agenda } = yield select((state) => state.salao);

    //console.log("agendamento: ", agendamento);
    //console.log("agenda: ", agenda);
    const finalStartDate =
      payload?.startDate ||
      (agenda.length === 0
        ? moment().format("YYYY-MM-DD")
        : Object.keys(agenda[0])[0]);

    const { data: res } = yield call(
      api.post,
      `/agendamento/dias-disponiveis`,
      {
        ...agendamento,
        data: finalStartDate,
      }
    );

    //console.log(res.agenda)

    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    const hoje = moment.tz("America/Sao_Paulo").format("YYYY-MM-DD");
    const horaAtual = moment.tz("America/Sao_Paulo");

    // console.log("hoje: ", hoje);
    // console.log("horaAtual: ", horaAtual);

    let agendaFiltrada = res.agenda
      .map((diaObj: any) => {
        const [data] = Object.keys(diaObj);
        const colabs = diaObj[data];

        //console.log("data: ", data);
        //console.log("colabs: ", colabs);

        // Se não for hoje, retorna o dia sem modificação
        if (data !== hoje) return diaObj;

        //console.log("diaObj: ", diaObj);

        // Filtra os horários de cada colaborador
        const colabsFiltrados: any = {};

        //console.log("horaAtual: ", horaAtual);

        Object.entries(colabs).forEach(([colabId, horarios]) => {
          const horariosValidos: string[][] = [];

          for (const [inicio, fim] of horarios as string[][]) {
            const horarioInicio = moment(
              `${hoje}T${inicio}`,
              "YYYY-MM-DDTHH:mm"
            );
            const horarioFim = moment(`${hoje}T${fim}`, "YYYY-MM-DDTHH:mm");

            const inicioValido = horarioInicio.isAfter(horaAtual);
            const fimValido = horarioFim.isAfter(horaAtual);

            if (inicioValido && fimValido) {
              horariosValidos.push([inicio, fim]);
            } else if (!inicioValido && fimValido) {
              horariosValidos.push([fim]); // Só o fim ainda é válido
            }
          }

          if (horariosValidos.length > 0) {
            colabsFiltrados[colabId] = horariosValidos;
            //console.log("horariosValidos: ", horariosValidos);
          }
        });

        // Se ainda houver pelo menos um colaborador com horários, retorna o dia filtrado
        if (Object.keys(colabsFiltrados).length > 0) {
          return { [data]: colabsFiltrados };
        }

        // Caso contrário, remove esse dia retornando null (filtraremos abaixo)
        return Object.keys(colabsFiltrados).length > 0
          ? { [data]: colabsFiltrados }
          : null;
      })
      .filter(Boolean); // Remove dias nulos (sem horários)

    //console.log("agendaFiltrada: ", JSON.stringify(agendaFiltrada[1]));

    if (agendaFiltrada.length === 0) {
      Toast.show({
        type: "info",
        text1: "Nenhum horário disponível",
        text2: "Hoje não há mais horários disponíveis.",
      });
    }

    const {
      data: dataSelecionada,
      horariosDisponiveis,
      colaboradorId,
    } = yield call(util.selectAgendamento, agendaFiltrada);

    const finalDate = moment(
      `${dataSelecionada}T${horariosDisponiveis[0][0]}`
    ).format();

    yield put(updateAgenda(agendaFiltrada));
    yield put(updateColaboradores(res.colaboradores));
    //yield put(updateAgendamento({ data: finalDate }));
    yield put(updateAgendamento({ colaboradorId }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
  }
}

// // Função para salvar agendamento
export function* saveAgendamento() {
  try {
    yield put(updateForm({ agendamentoLoading: true }));

    const { agendamento } = yield select((state) => state.salao);
    //console.log(agendamento)
    const { data: res } = yield call(api.post, `/agendamento`, agendamento);

    //nsole.log(res);
    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.error,
      });
      return false;
    }

    //console.log(res);
    //yield put(resetAgendamento());
    yield put(updateForm({ agendamentoLoading: false, saveAgendamento: true }));
    router.replace("/(home)/home");
  } catch (err: any) {
    // Verifica se é um erro de resposta da API com status e dados
    if (err.response && err.response.data) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: err.response.data.error,
      });
    } else {
      // Fallback para outros tipos de erro
      const message = err instanceof Error ? err.message : String(err);
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: message,
      });
    }
    yield put(updateForm({ agendamentoLoading: false }));
  }
}

// saga para criar a preferência no Mercado Pago
export function* createMercadoPagoCheckout({ payload }: any) {
  try {
    //console.log("payload: ", payload);
    const { data: res } = yield call(api.post, "/create-checkout", payload);

    if (res.error || !res.initPoint) {
      Toast.show({
        type: "error",
        text1: "Erro ao iniciar pagamento",
        text2: res.message || "Não foi possível criar o link de pagamento.",
      });
      return false;
    }

    //console.log("API:", res);

    // Abrir o link com o navegador do sistema
    yield put(referenceLink(res.initPoint));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro ao conectar com o Mercado Pago",
      text2: message,
    });
  }
}

// saga para atualizar o status do agendamento
export function* updateStatusAgendamento({ status }: any) {
  try {
    const { agendamento } = yield select((state) => state.cliente);
    const { data: res } = yield call(
      api.put,
      `/agendamento/status/${agendamento._id}`,
      { status }
    );

    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    if (status === "C") {
      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "O seu agendamento foi cancelado.",
      });
    }

    if (status === "A") {
      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "O seu agendamento foi confirmado com sucesso.",
      });
    }

    yield put(updateAgendamentoCliente(res.agendamento));
    console.log("agendamento: ", agendamento);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
  }
}

export default all([
  takeLatest(types.GET_SALAO, getSalao),
  takeLatest(types.ALL_SERVICOS, allServicos),
  takeLatest(types.FILTER_AGENDA, filterAgenda),
  takeLatest(types.SAVE_AGENDAMENTO, saveAgendamento),
  takeLatest(types.CREATE_CHECKOUT, createMercadoPagoCheckout),
  takeLatest(types.UPDATE_STATUS_AGENDAMENTO, updateStatusAgendamento),
]);
