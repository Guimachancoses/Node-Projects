import { router } from "expo-router";
import { call, put, takeLatest } from "redux-saga/effects";

import {
  createAvaliacaoFailure,
  createAvaliacaoSuccess,
} from "./action";
import {
  Avaliacao,
  CREATE_AVALIACAO_REQUEST,
  CreateAvaliacaoRequestAction,
} from "./types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.15.19:3333";

async function postAvaliacao(
  payload: CreateAvaliacaoRequestAction["payload"]
): Promise<Avaliacao> {
  const response = await fetch(`${API_URL}/criar-avaliacao/c76d0fe5-44a0-4c67-99f5-763fdd24c33e`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.erro || data?.message || "Erro ao salvar avaliacao.");
  }

  return data;
}

function* createAvaliacao(action: CreateAvaliacaoRequestAction) {
  try {
    const avaliacao: Avaliacao = yield call(postAvaliacao, action.payload);

    yield put(createAvaliacaoSuccess(avaliacao));
    router.replace("/obrigado");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar avaliacao.";

    yield put(createAvaliacaoFailure(message));
  }
}

export default function* avaliacaoSaga() {
  yield takeLatest(CREATE_AVALIACAO_REQUEST, createAvaliacao);
}
