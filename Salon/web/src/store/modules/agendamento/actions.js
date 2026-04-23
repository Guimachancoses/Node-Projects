import types from "./types";

export function filterAgendamentos(start, end) {
  return { type: types.FILTER_AGENDAMENTOS, start, end };
}

export function updateAgendamento(agendamentos) {
  return { type: types.UPDATE_AGENDAMENTO, agendamentos };
}

export function updateAgendamentoState(payload) {
  return { type: types.UPDATE_AGENDAMENTO_STATE, payload };
}

export function createAgendamentoRequest(payload) {
  return { type: types.CREATE_AGENDAMENTO_REQUEST, payload };
}

export function editAgendamentoRequest(payload) {
  return { type: types.EDIT_AGENDAMENTO_REQUEST, payload };
}

export function deleteAgendamentoRequest(id) {
  return { type: types.DELETE_AGENDAMENTO_REQUEST, id };
}

export function setAlerta(alerta) {
  return { type: types.SET_ALERTA_AGENDAMENTO, alerta };
}