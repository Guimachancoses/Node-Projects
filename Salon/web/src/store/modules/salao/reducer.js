import types from "./types";

const INITIAL_STATE = {
  empresa: null,
  error: null,
  form: {
    loading: false, // load
    saving: false,  // update
  },
};

export default function salao(state = INITIAL_STATE, action) {
  switch (action.type) {
    case types.LOAD_MY_COMPANY_REQUEST:
      return {
        ...state,
        error: null,
        form: { ...state.form, loading: true },
      };

    case types.LOAD_MY_COMPANY_SUCCESS:
      return {
        ...state,
        empresa: action.payload.empresa,
        error: null,
        form: { ...state.form, loading: false },
      };

    case types.LOAD_MY_COMPANY_FAILURE:
      return {
        ...state,
        error: action.payload.error,
        form: { ...state.form, loading: false },
      };

    case types.UPDATE_MY_COMPANY_REQUEST:
      return {
        ...state,
        error: null,
        form: { ...state.form, saving: true },
      };

    case types.UPDATE_MY_COMPANY_SUCCESS:
      return {
        ...state,
        empresa: action.payload.empresa,
        error: null,
        form: { ...state.form, saving: false },
      };

    case types.UPDATE_MY_COMPANY_FAILURE:
      return {
        ...state,
        error: action.payload.error,
        form: { ...state.form, saving: false },
      };

    default:
      return state;
  }
}