import types from "./types";

const INITIAL_STATE = {
    empresas: [],
    empresa: null,           // item sendo editado no drawer
    behavior: "create",
    components: { drawer: false, confirmDelete: false },
    form: { saving: false, filtering: false },
    error: null,
    alerta: { open: false, tipo: "success", mensagem: "" },
};

export default function empresa(state = INITIAL_STATE, action) {
    switch (action.type) {
        case types.ALL_EMPRESAS_SUCCESS:
            return { ...state, empresas: action.payload };

        case types.SET_EMPRESA:
            return { ...state, empresa: action.payload, behavior: action.payload?._id ? "update" : "create" };

        case types.SET_COMPONENTS:
            return { ...state, components: { ...state.components, ...action.payload } };

        case types.ADD_EMPRESA_REQUEST:
        case types.UPDATE_EMPRESA_REQUEST:
            return { ...state, form: { ...state.form, saving: true } };

        case types.ADD_EMPRESA_SUCCESS:
        case types.UPDATE_EMPRESA_SUCCESS:
            return { ...state, form: { ...state.form, saving: false }, components: { ...state.components, drawer: false } };

        case types.DELETE_EMPRESA_SUCCESS:
            return { ...state, empresas: state.empresas.filter((e) => e._id !== action.payload) };

        // Adicione esses cases no seu reducer:
        case types.ALL_EMPRESAS_REQUEST:
        case types.FILTER_EMPRESAS_REQUEST:
            return { ...state, form: { ...state.form, filtering: true }, error: null };

        case types.FILTER_EMPRESAS_SUCCESS:
            return {
                ...state,
                empresas: action.payload,
                form: { ...state.form, filtering: false }
            };

        case types.ALL_EMPRESAS_FAILURE:
        case types.ADD_EMPRESA_FAILURE:
        case types.UPDATE_EMPRESA_FAILURE:
        case types.DELETE_EMPRESA_FAILURE:
            return {
                ...state,
                error: action.payload,
                form: { ...state.form, saving: false, filtering: false }
            };

        case types.SET_ALERTA:
            return { ...state, alerta: action.payload };

        default:
            return state;
    }
}