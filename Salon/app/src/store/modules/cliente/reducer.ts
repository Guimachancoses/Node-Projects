import { produce } from "immer";
import types from "./types";
import _ from "lodash";


interface State {
  agendamento: object;
  agendamentos: any[];
  forms: {
    behavior: string;
  };
  cliente: {
    email: string;
    nome: string;
    sobrenome: string;
    identificacao: {
      tipoD: string;
      numero: string;
    };
    telefone: {
      area: string;
      numero: string;
    };
    senha: string;
    endereco: {
      cep: string;
      logradouro: string;
      bairro: string;
      numero: number;
      cidade: {
        nome: string;
      };
    };
    foto: string;
    dataNascimento: String;
    sexo: String;
    clienteId: string;
    prefPagamento: string;
  };
}

const INITIAL_STATE: State = {
  agendamentos: [],
  agendamento: {},
  forms: {
    behavior: "create",
  },
  cliente: {
    email: "",
    nome: "",
    sobrenome: "",
    identificacao: {
      tipoD: "CPF",
      numero: "",
    },
    telefone: {
      area: "+55",
      numero: "",
    },
    senha: "",
    endereco: {
      cep: "",
      logradouro: "",
      bairro: "",
      numero: 0,
      cidade: {
        nome: "",
      },
    },
    foto: "",
    dataNascimento: "",
    sexo: "",
    clienteId: "",
    prefPagamento: "L",
  },
};

function cliente(state = INITIAL_STATE, action: any): State {
  return produce(state, (draft) => {
    switch (action.type) {
      case types.UPDATE_CLIENTE:
        draft.cliente = { ...state.cliente, ...action.cliente };
        break;

      case types.UPDATE_FORM:
        draft.forms = { ...state.forms, ...action.forms };
        break;

      case types.UPDATE_AGENDAMENTOS:
        const existingDates = new Set(
          state.agendamentos.map((item) => Object.keys(item)[0])
        );
        const newagendamentos = action.agendamentos.filter(
          (item: any) => !existingDates.has(Object.keys(item)[0])
        );
        draft.agendamentos = [...state.agendamentos, ...newagendamentos];
        break;

      case types.RESET_CLIENTE:
        draft.agendamentos = INITIAL_STATE.agendamentos;
        draft.cliente = INITIAL_STATE.cliente;
        draft.forms = INITIAL_STATE.forms;
        break;

      case types.UPDATE_AGENDAMENTO:
        draft.agendamento = { ...state.agendamento, ...action.agendamento };
        break;

      case types.RESET_AGENDAMENTO:
        draft.agendamento = INITIAL_STATE.agendamento;
        break;

      default:
        break;
    }
  });
}

export default cliente;
