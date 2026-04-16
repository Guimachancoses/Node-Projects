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
  clientes: [],
  cliente: {
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

function cliente(state = INITIAL_STATE, action) {
  //console.log('REDUCER -> cliente foi chamado', action.type);
  //console.log('Estado antes da ação:', state); // Verificando o estado antes de qualquer alteração

  switch (action.type) {
    case types.UPDATE_CLIENTE: {
      return produce(state, (draft) => {
        Object.entries(action.payload).forEach(([key, value]) => {
          draft[key] = value;
        });
      });
    }

    case types.RESET_CLIENTE: {
      return produce(state, (draft) => {
        draft.cliente = INITIAL_STATE.cliente;
      });
    }

    case types.SET_ALERTA: {
      return produce(state, (draft) => {
        draft.alerta = action.alerta;
      });
    }

    //console.log('Estado após a ação UPDATE_CLIENTE:', newState); // Verificando o estado após a atualização

    default:
      return state;
  }
}

export default cliente;
