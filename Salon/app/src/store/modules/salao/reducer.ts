import { produce } from "immer";
import types from "./types";
import _ from "lodash";
import Constants from "expo-constants";

const SALAOID = Constants.expoConfig?.extra?.EXPO_SALAO_ID;

interface State {
  payload: Record<string, any>;
  link: any;
  salao: Record<string, any>;
  servicos: any[];
  tipoServicos: any[];
  typeChoice: string;
  agenda: any[];
  colaboradores: any[];
  agendamento: {
    clienteId: string | number;
    salaoId: string | number;
    servicoId: string | number | null;
    colaboradorId: string | number | null;
    transectionId: string | number | null;
    status_payment: string | number | null;
    status: string | number | null;
    data: string | null;
  };
  form: {
    inputFiltro: string;
    inputFiltroFoco: boolean;
    modalEspecialista: boolean;
    modalAgendamento: number;
    buttomSheetDt: number;
    agendamentoLoading: boolean;
    buttonCard: boolean;
    saveAgendamento: boolean;
  };
}

const INITIAL_STATE: State = {
  payload: {},
  link: null,
  salao: {},
  servicos: [],
  tipoServicos: [],
  typeChoice: "",
  agenda: [],
  colaboradores: [],
  agendamento: {
    clienteId: "",
    salaoId: `${SALAOID}`,
    servicoId: null,
    colaboradorId: null,
    transectionId: null,
    status_payment: "P",
    status: "P",
    data: null,
  },
  form: {
    inputFiltro: "",
    inputFiltroFoco: false,
    modalEspecialista: false,
    modalAgendamento: 0,
    buttomSheetDt: 0,
    agendamentoLoading: false,
    buttonCard: false,
    saveAgendamento: false,
  },
};

function salao(state = INITIAL_STATE, action: any): State {
  return produce(state, (draft) => {
    switch (action.type) {
      case types.UPDATE_FORM:
        draft.form = { ...state.form, ...action.form };
        break;

      case types.UPDATE_SALAO:
        draft.salao = { ...draft.salao, ...action.salao };
        break;

      case types.UPDATE_SERVICOS:
        draft.servicos = action.servicos;
        break;

      case types.REFERENCE_LINK:
        draft.link = action.link;
        break;

      case types.UPDATE_AGENDA:
        const existingDates = new Set(
          state.agenda.map((item) => Object.keys(item)[0])
        );
        const newAgenda = action.agenda.filter(
          (item: any) => !existingDates.has(Object.keys(item)[0])
        );
        draft.agenda = [...state.agenda, ...newAgenda];
        break;

      case types.UPDATE_COLABORADORES:
        draft.colaboradores = _.uniqBy(
          [...state.colaboradores, ...action.colaboradores],
          "_id"
        );
        break;

      case types.UPDATE_AGENDAMENTO:
        if (action.agendamento.servicoId) {
          draft.form.modalAgendamento = 2;
        }
        draft.agendamento = { ...state.agendamento, ...action.agendamento };
        break;

      case types.UPDATE_TIPO_SERVICOS:
        draft.tipoServicos = action.tipoServicos;
        break;

      case types.UPDATE_TYPE_CHOICE:
        draft.typeChoice = action.typeChoice;
        break;

      case types.RESET_AGENDAMENTO:
        draft.agenda = INITIAL_STATE.agenda;
        draft.colaboradores = INITIAL_STATE.colaboradores;
        draft.agendamento = INITIAL_STATE.agendamento;
        draft.link = INITIAL_STATE.link;
        draft.payload = INITIAL_STATE.payload;
        draft.form = INITIAL_STATE.form;
        break;

      case types.RESET_SALAO:
        draft.salao = INITIAL_STATE.salao;
        draft.servicos = INITIAL_STATE.servicos;
        draft.agenda = INITIAL_STATE.agenda;
        draft.agenda = INITIAL_STATE.agenda;
        draft.colaboradores = INITIAL_STATE.colaboradores;
        draft.agendamento = INITIAL_STATE.agendamento;
        draft.link = INITIAL_STATE.link;
        draft.payload = INITIAL_STATE.payload;
        draft.form = INITIAL_STATE.form;
        break;

      default:
        // Se não for nenhum dos tipos conhecidos, não altera o estado
        break;
    }
  });
}

export default salao;
