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

export function checkUser(email) {
  return { type: types.CHECK_USER, email };
}

export function updateUser(user) {
  return { type: types.UPDATE_USER, user };
}

export function updateMyAccountRequest(payload, fotoFile = null) {
  return { type: types.UPDATE_MY_ACCOUNT_REQUEST, payload, fotoFile };
}

export function updateMyAccountSuccess(user) {
  return { type: types.UPDATE_MY_ACCOUNT_SUCCESS, user };
}

export function loadMyAccountRequest(email) {
  return { type: types.LOAD_MY_ACCOUNT_REQUEST, email };
}

export function loadMyAccountSuccess(user) {
  return { type: types.LOAD_MY_ACCOUNT_SUCCESS, user };
}
