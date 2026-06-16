import {
  Avaliacao,
  AvaliacaoPayload,
  CREATE_AVALIACAO_FAILURE,
  CREATE_AVALIACAO_REQUEST,
  CREATE_AVALIACAO_SUCCESS,
  RESET_AVALIACAO_STATUS,
} from "./types";

export function createAvaliacaoRequest(payload: AvaliacaoPayload) {
  return {
    type: CREATE_AVALIACAO_REQUEST,
    payload,
  };
}

export function createAvaliacaoSuccess(payload: Avaliacao) {
  return {
    type: CREATE_AVALIACAO_SUCCESS,
    payload,
  };
}

export function createAvaliacaoFailure(payload: string) {
  return {
    type: CREATE_AVALIACAO_FAILURE,
    payload,
  };
}

export function resetAvaliacaoStatus() {
  return {
    type: RESET_AVALIACAO_STATUS,
  };
}
