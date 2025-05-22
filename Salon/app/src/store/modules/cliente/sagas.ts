import types from "./types";
import api from "@/src/services/api";
import { all, call, takeLatest, select, put } from "redux-saga/effects";

import { updateAgendamentos, updateCliente } from "./action";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import Constants from "expo-constants";

const SALAOID = Constants.expoConfig?.extra?.EXPO_SALAO_ID;
//console.log("SALAOID SAGAS CLIENTE: ", SALAOID);

export function* filterCliente() {
  try {
    const { cliente } = yield select((state) => state.cliente);

    const { data: res } = yield call(api.post, `/cliente/filter`, {
      filters: {
        email: cliente.email,
      },
    });

    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    //console.log("Resposta completa da API:", res);

    if (res.clientes.length > 0) {
      yield put(updateCliente(res.clientes[0]));
      yield put(updateCliente({ clienteId: res.clientes._id }));
      router.replace("/(home)/home");
    } else {
      router.replace("/completRg");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
    //console.log(message)
  }
}

export function* addCliente() {
  try {
    const { cliente } = yield select((state) => state.cliente);

    //console.log("cliente: ", cliente);

    const { data: res } = yield call(api.post, `/cliente`, {
      salaoId: SALAOID,
      cliente: cliente,
    });

    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    //console.log("Resposta completa da API:", res);
    yield put(updateCliente({ clienteId: res.clienteId }));
    router.replace("/(home)/home");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
  }
}

export function* getCliente() {
  try {
    const { cliente } = yield select((state) => state.cliente);

    const { data: res } = yield call(api.post, `/cliente/filter`, {
      filters: {
        email: cliente.email,
      },
    });

    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    yield put(updateCliente({ clienteId: res.clientes[0]._id }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
  }
}

export function* updateCadastro() {
  try {
    const { cliente } = yield select((state) => state.cliente);

    //console.log("cliente: ", cliente);

    const { data: res } = yield call(api.put, `/cliente/${cliente.clienteId}`, {
      cliente,
    });

    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    //console.log("Resposta completa da API:", res);
    yield put(updateCliente({ clienteId: res.clienteId }));
    Toast.show({
      type: "success",
      text1: "Sucesso!",
      text2: "Cadastro alterado!",
    });
    router.replace("/(home)/home");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
  }
}

export function* filterAgendamentos({ filters }: any) {
  try {
    const { cliente } = yield select((state) => state.cliente);

    const { data: res } = yield call(
      api.post,
      `/agendamento/filter-agendamentos`,
      {
        filters: {
          ...filters,
          clienteId: cliente.clienteId,
        },
      }
    );

    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }

    yield put(updateAgendamentos(res.agendamentos));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
    //console.log(message)
  }
}

export default all([
  takeLatest(types.FILTER_CLIENTE, filterCliente),
  takeLatest(types.ADD_CLIENTE, addCliente),
  takeLatest(types.GET_CLIENTE, getCliente),
  takeLatest(types.UPDATE_CADASTRO, updateCadastro),
  takeLatest(types.FILTER_AGENDAMENTOS, filterAgendamentos),
]);
