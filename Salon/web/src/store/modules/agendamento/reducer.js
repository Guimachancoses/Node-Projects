import types from "./types";
import { produce } from "immer";

const INITIAL_STATE = {
  components: {
    modal: false,         // legado
    drawer: false,        // novo
    confirmDelete: false, // novo
  },
  agendamento: {},
  agendamentos: [],
  behavior: "view",
  form: {
    loading: false,
    disabled: true,
  },
  alerta: {
    open: false,
    severity: "success",
    title: "",
    message: "",
  },
};

function agendamento(state = INITIAL_STATE, action) {
  switch (action.type) {
    case types.UPDATE_AGENDAMENTO:
      return produce(state, (draft) => {
        draft.agendamentos = action.agendamentos || [];
      });

    case types.UPDATE_AGENDAMENTO_STATE:
      return produce(state, (draft) => {
        const payload = action.payload || {};

        // Usa !== undefined para permitir valores falsy sem ignorar update
        if (payload.agendamento !== undefined) draft.agendamento = payload.agendamento;
        if (payload.agendamentos !== undefined) draft.agendamentos = payload.agendamentos;
        if (payload.behavior !== undefined) draft.behavior = payload.behavior;

        if (payload.components !== undefined) {
          draft.components = { ...draft.components, ...payload.components };
        }

        if (payload.form !== undefined) {
          draft.form = { ...draft.form, ...payload.form };
        }

        if (payload.alerta !== undefined) {
          draft.alerta = { ...draft.alerta, ...payload.alerta };
        }
      });

    case types.SET_ALERTA_AGENDAMENTO:
      return produce(state, (draft) => {
        draft.alerta = { ...draft.alerta, ...action.alerta };
      });

    default:
      return state;
  }
}

export default agendamento;