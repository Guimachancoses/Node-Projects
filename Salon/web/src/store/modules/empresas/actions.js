import types from "./types";

export const allEmpresas = () => ({ type: types.ALL_EMPRESAS_REQUEST });

export const allEmpresasSuccess = (empresas) => ({
  type: types.ALL_EMPRESAS_SUCCESS,
  payload: empresas,
});

export const allEmpresasFailure = (error) => ({
  type: types.ALL_EMPRESAS_FAILURE,
  payload: error,
});

export const filterEmpresas = (filters) => ({
  type: types.FILTER_EMPRESAS_REQUEST,
  payload: filters,
});

export const filterEmpresasSuccess = (empresas) => ({
  type: types.FILTER_EMPRESAS_SUCCESS,
  payload: empresas,
});

export const addEmpresa = (payload) => ({
  type: types.ADD_EMPRESA_REQUEST,
  payload,
});

export const addEmpresaSuccess = (empresa) => ({
  type: types.ADD_EMPRESA_SUCCESS,
  payload: empresa,
});

export const addEmpresaFailure = (error) => ({
  type: types.ADD_EMPRESA_FAILURE,
  payload: error,
});

export const updateEmpresa = (payload) => ({
  type: types.UPDATE_EMPRESA_REQUEST,
  payload,
});

export const updateEmpresaSuccess = (empresa) => ({
  type: types.UPDATE_EMPRESA_SUCCESS,
  payload: empresa,
});

export const updateEmpresaFailure = (error) => ({
  type: types.UPDATE_EMPRESA_FAILURE,
  payload: error,
});

export const deleteEmpresa = (id) => ({
  type: types.DELETE_EMPRESA_REQUEST,
  payload: id,
});

export const deleteEmpresaSuccess = (id) => ({
  type: types.DELETE_EMPRESA_SUCCESS,
  payload: id,
});

export const deleteEmpresaFailure = (error) => ({
  type: types.DELETE_EMPRESA_FAILURE,
  payload: error,
});

export const setEmpresa = (empresa) => ({
  type: types.SET_EMPRESA,
  payload: empresa,
});

export const setComponents = (components) => ({
  type: types.SET_COMPONENTS,
  payload: components,
});

export const setAlerta = (alerta) => ({
  type: types.SET_ALERTA,
  payload: alerta,
});