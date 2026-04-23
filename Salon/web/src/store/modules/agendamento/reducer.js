import types from "./types";
import { produce } from "immer";

const INITIAL_STATE = {
  components: {
    modal: false,          // legado
    drawer: false,         // novo
    confirmDelete: false,  // novo
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

        if (payload.agendamento) draft.agendamento = payload.agendamento;
        if (payload.behavior) draft.behavior = payload.behavior;

        if (payload.components) {
          draft.components = { ...draft.components, ...payload.components };
        }

        if (payload.form) {
          draft.form = { ...draft.form, ...payload.form };
        }

        if (payload.alerta) {
          draft.alerta = { ...draft.alerta, ...payload.alerta };
        }
      });

    default:
      return state;
  }
}

export default agendamento;