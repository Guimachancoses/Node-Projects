import types from "./types";
export function allClientes() {
  return { type: types.ALL_CLIENTES };
}

export function updateCliente(payload) {
  return { type: types.UPDATE_CLIENTE, payload };
}

export function filterClientes(filters) {
  return { type: types.FILTER_CLIENTES, filters };
}

export function addCliente() {
  return { type: types.ADD_CLIENTE };
}

export function resetCliente() {
  return { type: types.RESET_CLIENTE };
}

export function setAlerta(alerta) {
  return { type: types.SET_ALERTA, alerta };
}

export function unlinkCliente(vinculoId) {
  return { type: types.UNLINK_CLIENTE, vinculoId };
}
