import types from "./types";
export function allServicos() {
  return { type: types.ALL_SERVICOS };
}

export function updateServico(payload) {
  return { type: types.UPDATE_SERVICO, payload };
}

export function addServico() {
  return { type: types.ADD_SERVICO };
}

export function resetServico() {
  return { type: types.RESET_SERVICO };
}

export function setAlerta(alerta) {
  return { type: types.SET_ALERTA, alerta };
}


export function removeServico(vinculoId) {
  return { type: types.REMOVE_SERVICO, vinculoId };
}

export function removeArquivo(key) {
  return { type: types.REMOVE_ARQUIVO, key };
}