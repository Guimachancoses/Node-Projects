import { produce } from "immer";
import types from "./types";

const INITIAL_STATE = {
  behavior: "create", // update
  components: {
    drawer: false,
    confirmDelete: false,
    view: "week",
  },
  form: {
    filtering: false,
    disabled: true,
    saving: false,
  },
  colaboradores: [],
  servicos: [],
  horarios: [],
  horario: {
    diasi: [],
    inicio: "",
    fim: "",
    especialidades: [],
    colaboradores: [],
  },
  alerta: {
    severity: "", // "success", "error", "info", "warning"
    message: "",
    title: "",
    open: false,
  },
};

function horario(state = INITIAL_STATE, action) {
  //console.log('REDUCER -> horario foi chamado', action.type);
  //console.log('Estado antes da ação:', state); // Verificando o estado antes de qualquer alteração

  switch (action.type) {
    case types.UPDATE_HORARIO: {
      return produce(state, (draft) => {
        Object.entries(action.payload).forEach(([key, value]) => {
          draft[key] = value;
        });
      });
    }

    case types.RESET_HORARIO: {
      return produce(state, (draft) => {
        draft.horario = INITIAL_STATE.horario;
      });
    }

    case types.SET_ALERTA: {
      return produce(state, (draft) => {
        draft.alerta = action.alerta;
      });
    }

    //console.log('Estado após a ação UPDATE_HORARIO:', newState); // Verificando o estado após a atualização

    default:
      return state;
  }
}

export default horario;
