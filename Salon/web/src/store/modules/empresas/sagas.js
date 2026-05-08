import { all, call, put, takeLatest } from "redux-saga/effects";
import api from "../../../services/api";
import types from "./types";
import {
  allEmpresasSuccess,
  allEmpresasFailure,
  filterEmpresasSuccess,
  addEmpresaSuccess,
  addEmpresaFailure,
  updateEmpresaSuccess,
  updateEmpresaFailure,
  deleteEmpresaSuccess,
  deleteEmpresaFailure,
  allEmpresas,           // ← adicionado para recarregar a lista
} from "./actions";
import { setAlerta } from "../colaborador/actions";

const getErrorMessage = (err, fallback = "Erro desconhecido") =>
  err?.response?.data?.message || err?.message || fallback;

// -------- LOAD ALL --------
function* loadEmpresas() {
  try {
    const { data } = yield call(api.get, "/salao/empresas");
    yield put(allEmpresasSuccess(data.saloes || data || []));
    console.log("data", data)
  } catch (err) {
    const message = getErrorMessage(err, "Erro ao carregar empresas.");
    yield put(allEmpresasFailure(message));
    yield put(setAlerta({ open: true, tipo: "error", mensagem: message }));
  }
}

// -------- FILTER --------
function* filterEmpresas({ payload }) {
  try {
    const { data } = yield call(api.get, "/salao/empresas", { params: payload });
    yield put(filterEmpresasSuccess(data.saloes || data || []));
  } catch (err) {
    const message = getErrorMessage(err, "Erro ao filtrar empresas.");
    yield put(allEmpresasFailure(message));
    yield put(setAlerta({ open: true, tipo: "error", mensagem: message }));
  }
}

// -------- BUILD FORM DATA --------
function buildFormData(payload) {
  const data = payload?.data || payload;
  const { logoFile, capaFile, apresentacaoFile } = payload;

  const fd = new FormData();
  fd.append("nome", data?.nome || "");
  fd.append("email", data?.email || "");
  fd.append("telefone", data?.telefone || "");
  fd.append("status", data?.status || "A");
  fd.append("identificacao[tipoD]", data?.identificacao?.tipoD || "");
  fd.append("identificacao[numero]", data?.identificacao?.numero || "");

  const endereco = data?.endereco || {};
  Object.keys(endereco).forEach((key) => {
    fd.append(`endereco[${key}]`, endereco[key] || "");
  });

  if (Array.isArray(data?.geo?.coordinates)) {
    data.geo.coordinates.forEach((coord, i) => {
      fd.append(`geo[coordinates][${i}]`, String(coord));
    });
  }

  if (logoFile) fd.append("logo", logoFile);
  if (capaFile) fd.append("capa", capaFile);
  if (apresentacaoFile) fd.append("apresentacao", apresentacaoFile);

  return fd;
}

// -------- CREATE --------
function* createEmpresa({ payload }) {
  try {
    const formData = buildFormData(payload);
    const { data } = yield call(api.post, "/salao", formData);

    if (data?.error) throw new Error(data.message);

    yield put(addEmpresaSuccess(data.salao || data));
    yield put(setAlerta({ open: true, tipo: "success", mensagem: "Empresa criada com sucesso!" }));
    yield put(allEmpresas());
  } catch (err) {
    const message = getErrorMessage(err, "Erro ao criar empresa.");
    yield put(addEmpresaFailure(message));
    yield put(setAlerta({ open: true, tipo: "error", mensagem: message }));
  }
}

// -------- UPDATE --------
function* updateEmpresa({ payload }) {
  try {
    const formData = buildFormData(payload);
    const { data } = yield call(api.put, `/salao/${payload.id}`, formData);

    if (data?.error) throw new Error(data.message);

    yield put(updateEmpresaSuccess(data.salao || data));
    yield put(setAlerta({ open: true, tipo: "success", mensagem: "Empresa atualizada com sucesso!" }));
    yield put(allEmpresas());
  } catch (err) {
    const message = getErrorMessage(err, "Erro ao atualizar empresa.");
    yield put(updateEmpresaFailure(message));
    yield put(setAlerta({ open: true, tipo: "error", mensagem: message }));
  }
}

// -------- DELETE --------
function* removeEmpresa({ payload: id }) {
  try {
    yield call(api.delete, `/salao/empresas/${id}`);
    yield put(deleteEmpresaSuccess(id));
    yield put(setAlerta({ open: true, tipo: "success", mensagem: "Empresa removida com sucesso!" }));
    yield put(allEmpresas());
  } catch (err) {
    const message = getErrorMessage(err, "Erro ao remover empresa.");
    yield put(deleteEmpresaFailure(message));
    yield put(setAlerta({ open: true, tipo: "error", mensagem: message }));
  }
}

export default all([
  takeLatest(types.ALL_EMPRESAS_REQUEST, loadEmpresas),
  takeLatest(types.FILTER_EMPRESAS_REQUEST, filterEmpresas),
  takeLatest(types.ADD_EMPRESA_REQUEST, createEmpresa),
  takeLatest(types.UPDATE_EMPRESA_REQUEST, updateEmpresa),
  takeLatest(types.DELETE_EMPRESA_REQUEST, removeEmpresa),
]);