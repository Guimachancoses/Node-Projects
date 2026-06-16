import {
  AvaliacaoAction,
  AvaliacaoState,
  CREATE_AVALIACAO_FAILURE,
  CREATE_AVALIACAO_REQUEST,
  CREATE_AVALIACAO_SUCCESS,
  RESET_AVALIACAO_STATUS,
} from "./types";

const initialState: AvaliacaoState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

export default function avaliacao(
  state = initialState,
  action: AvaliacaoAction
): AvaliacaoState {
  switch (action.type) {
    case CREATE_AVALIACAO_REQUEST:
      return {
        ...state,
        loading: true,
        success: false,
        error: null,
      };

    case CREATE_AVALIACAO_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
        data: action.payload,
      };

    case CREATE_AVALIACAO_FAILURE:
      return {
        ...state,
        loading: false,
        success: false,
        error: action.payload,
      };

    case RESET_AVALIACAO_STATUS:
      return {
        ...state,
        loading: false,
        success: false,
        error: null,
      };

    default:
      return state;
  }
}
