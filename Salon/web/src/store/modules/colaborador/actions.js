import types from "./types";
export function allColaboradores() {
  return { type: types.ALL_COLABORADORES };
}

export function updateColaborador(payload) {
  return { type: types.UPDATE_COLABORADOR, payload };
}

export function filterColaboradores(filters) {
  return { type: types.FILTER_COLABORADORES, filters };
}

export function addColaborador() {
  return { type: types.ADD_COLABORADOR };
}

export function resetColaborador() {
  return { type: types.RESET_COLABORADOR };
}

export function setAlerta(alerta) {
  return { type: types.SET_ALERTA, alerta };
}

export function unlinkColaborador(vinculoId) {
  return { type: types.UNLINK_COLABORADOR, vinculoId };
}

export function allServicos() {
  return { type: types.ALL_SERVICOS };
}

export function checkUser() {
  return { type: types.CHECK_USER };
}

export function updateUser(user) {
  return { type: types.UPDATE_USER, user };
}

