import { produce } from "immer";
import types from "./types";
import moment from 'moment'

const INITIAL_STATE = {
  behavior: "create", // update
  components: {
    drawer: false,
    confirmDelete: false,
  },
  form: {
    filtering: false,
    disabled: true,
    saving: false,
  },
  servicos: [],
  servico: {
    titulo: "",
    preco: "",
    comissao: "",
    duracao: moment("00:30", "HH:mm").format(),
    recorrencia: "",
    status: "A",
    arquivos: [],
  },
  alerta: {
    severity: "", // "success", "error", "info", "warning"
    message: "",
    title: "",
    open: false,
  },
};

function servico(state = INITIAL_STATE, action) {
  //console.log('REDUCER -> servico foi chamado', action.type);
  //console.log('Estado antes da ação:', state); // Verificando o estado antes de qualquer alteração

  switch (action.type) {
    case types.UPDATE_SERVICO: {
      return produce(state, (draft) => {
        Object.entries(action.payload).forEach(([key, value]) => {
          draft[key] = value;
        });
      });
    }

    case types.RESET_SERVICO: {
      return produce(state, (draft) => {
        draft.servico = INITIAL_STATE.servico;
      });
    }

    case types.SET_ALERTA: {
      return produce(state, (draft) => {
        draft.alerta = action.alerta;
      });
    }

    //console.log('Estado após a ação UPDATE_COLABORAR:', newState); // Verificando o estado após a atualização

    default:
      return state;
  }
}

export default servico;
