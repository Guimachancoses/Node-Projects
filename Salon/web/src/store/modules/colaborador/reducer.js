import { produce } from "immer";
import types from "./types";

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
  colaboradores: [],
  servicos: [],
  colaborador: {
    vinculo: "A",
    especialidades: [],
    telefone: { area: "", numero: "" },
    identificacao: { tipoD: "", numero: "" },
    endereco: {
      cidade: { nome: "" },
      cep: "",
      logradouro: "",
      numero: null,
    },
    email: "",
    nome: "",
    sobrenome: "",
    senha: "",
    enderecoPadrao: "",
    foto: "",
    dataNascimento: "",
    sexo: "",
  },
  alerta: {
    severity: "", // "success", "error", "info", "warning"
    message: "",
    title: "",
    open: false,
  },
};

function colaborador(state = INITIAL_STATE, action) {
  //console.log('REDUCER -> colaborador foi chamado', action.type);
  //console.log('Estado antes da ação:', state); // Verificando o estado antes de qualquer alteração

  switch (action.type) {
    case types.UPDATE_COLABORADOR: {
      return produce(state, (draft) => {
        Object.entries(action.payload).forEach(([key, value]) => {
          draft[key] = value;
        });
      });
    }

    case types.RESET_COLABORADOR: {
      return produce(state, (draft) => {
        draft.colaborador = INITIAL_STATE.colaborador;
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

export default colaborador;
