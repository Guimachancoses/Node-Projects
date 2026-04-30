import types from "./types";
import api from "@/src/services/api";
import { all, call, takeLatest, select, put } from "redux-saga/effects";
import { updateAgendamentos, updateCliente } from "./action";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import Constants from "expo-constants";

const SALAO_ID = Constants.expoConfig?.extra?.EXPO_SALAO_ID;

export function* filterCliente({ email, shouldRedirect = true }: any) {
  try {
    const { cliente } = yield select((state: any) => state.cliente);
    const emailToUse = email ?? cliente?.email;

    if (!emailToUse) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: "Email não informado.",
      });
      return false;
    }

    const { data: res } = yield call(api.post, `/cliente/filter`, {
      filters: { email: emailToUse },
    });

    if (res.error) {
      Toast.show({ type: "error", text1: "Erro!", text2: res.message });
      return false;
    }

    if (res?.clientes?.length > 0) {
      const clienteDb = res.clientes[0];
      yield put(updateCliente(clienteDb));
      yield put(updateCliente({ clienteId: clienteDb._id }));

      if (shouldRedirect) router.replace("/(home)/home");
    } else {
      if (shouldRedirect) router.replace("/completRg");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({ type: "error", text1: "Erro!", text2: message });
  }
}

export function* addCliente() {
  try {
    const { cliente } = yield select((state: any) => state.cliente);

    const { data: res } = yield call(api.post, `/cliente`, {
      salaoId: SALAO_ID,
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

export function* getCliente({ email }: any = {}) {
  try {
    const { cliente } = yield select((state: any) => state.cliente);
    const emailToUse = email ?? cliente?.email;

    if (!emailToUse) return false;

    const { data: res } = yield call(api.post, `/cliente/filter`, {
      filters: { email: emailToUse },
    });

    if (res.error) {
      Toast.show({ type: "error", text1: "Erro!", text2: res.message });
      return false;
    }

    if (res?.clientes?.length > 0) {
      const clienteDb = res.clientes[0];
      yield put(updateCliente(clienteDb));
      yield put(updateCliente({ clienteId: clienteDb._id }));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({ type: "error", text1: "Erro!", text2: message });
  }
}

export function* updateCadastro() {
  try {
    const { cliente } = yield select((state: any) => state.cliente);
    const clienteId = cliente?.clienteId ?? cliente?._id;

    const { data: res } = yield call(api.put, `/cliente/${clienteId}`, {
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
    const { cliente } = yield select((state: any) => state.cliente);
    const clienteId = cliente?.clienteId ?? cliente?._id;

    const { data: res } = yield call(api.post, `/agendamento/filter-agendamentos`, {
      filters: {
        ...filters,
        clienteId,
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

    yield put(updateAgendamentos(res.agendamentos));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Toast.show({
      type: "error",
      text1: "Erro!",
      text2: message,
    });
  }
}

export function* pushToken({ token }: any) {
  try {
    const { cliente } = yield select((state: any) => state.cliente);
    const referenciaId = cliente?.clienteId ?? cliente?._id;

    if (!token || !referenciaId) return false;

    const { data: res } = yield call(api.post, `/push-token`, {
      token,
      model: "Cliente",
      referenciaId,
    });

    if (res.error) {
      Toast.show({
        type: "error",
        text1: "Erro!",
        text2: res.message,
      });
      return false;
    }
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
  takeLatest(types.FILTER_CLIENTE, filterCliente),
  takeLatest(types.ADD_CLIENTE, addCliente),
  takeLatest(types.GET_CLIENTE, getCliente),
  takeLatest(types.UPDATE_CADASTRO, updateCadastro),
  takeLatest(types.FILTER_AGENDAMENTOS, filterAgendamentos),
  takeLatest(types.PUSH_TOKEN, pushToken),
]);