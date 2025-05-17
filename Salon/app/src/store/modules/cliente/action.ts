import types from "./types";

export const updateCliente = (cliente: any) => ({
  type: types.UPDATE_CLIENTE,
  cliente,
});

export const filterClinte = () => ({
  type: types.FILTER_CLIENTE,
});

export function addCliente() {
  return { type: types.ADD_CLIENTE };
}


export const getCliente = () => ({
  type: types.GET_CLIENTE,
});

export const updateCadastro = () => ({
  type: types.UPDATE_CADASTRO,
});

export const updateForm = (forms: any) => ({
  type: types.UPDATE_FORM,
  forms
});

export const filterAgendamentos = (filters: any) => ({
  type: types.FILTER_AGENDAMENTOS,
  filters,
});

export const updateAgendamentos = (agendamentos: any) => ({
  type: types.UPDATE_AGENDAMENTOS,
  agendamentos,
});

export const resetCliente = () => ({
  type: types.RESET_CLIENTE,
});

export const updateAgendamento = (agendamento: any) => ({
  type: types.UPDATE_AGENDAMENTO,
  agendamento,
});

export const resetAgendamento = () => ({
  type: types.RESET_AGENDAMENTO,
});
