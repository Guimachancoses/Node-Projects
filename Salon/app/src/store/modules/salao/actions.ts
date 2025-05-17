import types from "./types";

// Exemplo de tipagem básica - você pode refinar conforme os tipos reais
export const getSalao = () => ({
  type: types.GET_SALAO,
});

export const updateSalao = (salao: Record<string, any>) => ({
  type: types.UPDATE_SALAO,
  salao,
});

export const allServicos = () => ({
  type: types.ALL_SERVICOS,
});

export const updateServicos = (servicos: []) => ({
  type: types.UPDATE_SERVICOS,
  servicos,
});

export const updateAgendamento = (agendamento: any) => ({
  type: types.UPDATE_AGENDAMENTO,
  agendamento,
});

export const updateForm = (form: any) => ({
  type: types.UPDATE_FORM,
  form,
});

export const filterAgenda = (startDate?: string) => ({
  type: types.FILTER_AGENDA,
  payload: { startDate },
});

export const updateAgenda = (agenda: []) => ({
  type: types.UPDATE_AGENDA,
  agenda,
});

export const updateColaboradores = (colaboradores: []) => ({
  type: types.UPDATE_COLABORADORES,
  colaboradores,
});

export const resetAgendamento = () => ({
  type: types.RESET_AGENDAMENTO,
});

export const saveAgendamento = () => ({
  type: types.SAVE_AGENDAMENTO,
});

export const createMercadoPagoCheckout = (payload: any) => ({
  type: types.CREATE_CHECKOUT,
  payload
});

export const referenceLink = (link: any) => ({
  type: types.REFERENCE_LINK,
  link
});

export const resetSalao = () => ({
  type: types.RESET_SALAO,
});

export const updateStatusAgendamento = (status: any) => ({
  type: types.UPDATE_STATUS_AGENDAMENTO,
  status
});

export const updateTipoServicos = (tipoServicos: any) => ({
  type: types.UPDATE_TIPO_SERVICOS,
  tipoServicos
});

export const updateTypeChoice = (typeChoice: any) => ({
  type: types.UPDATE_TYPE_CHOICE,
  typeChoice
});