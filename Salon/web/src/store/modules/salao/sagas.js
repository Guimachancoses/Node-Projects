import { all, call, put, takeLatest, select, delay } from "redux-saga/effects";
import api from "../../../services/api";
import types from "./types";
import {
  loadMyCompanySuccess,
  loadMyCompanyFailure,
  updateMyCompanySuccess,
  updateMyCompanyFailure,
} from "./actions";
import { setAlerta } from "../colaborador/actions";

// Ajuste conforme seu estado real
const getSalaoId = (state) =>
  state.colaborador?.user?.salaoId ||
  state.auth?.salaoId ||
  state.auth?.user?.salaoId ||
  state.salao?.empresa?._id;

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  err?.message ||
  fallback;

function* waitForUserReady(maxTentativas = 20, intervaloMs = 150) {
  for (let i = 0; i < maxTentativas; i++) {
    const userRaw = yield select((state) => state.colaborador?.user);
    const user = userRaw?.user ? userRaw.user : userRaw;

    const hasEmail = !!user?.email;
    const hasSalao = !!user?.salaoId;
    const isYoda = user?.funcao === "yoda";

    // yoda pode não ter salaoId -> ok
    if (hasEmail && (hasSalao || isYoda)) return user;

    yield delay(intervaloMs);
  }
  return null;
}

const SALAOID = `${process.env.REACT_APP_SALAO_ID}`;

// -------- LOAD --------
function* loadMyCompany() {
  try {
    const user = yield call(waitForUserReady);
    const salaoIdFromState = yield select(getSalaoId);
    const salaoId = salaoIdFromState || SALAOID; // prioriza estado, depois EN

    // se for yoda e não houver salaoId definido, não força erro aqui
    if (!salaoId && user?.funcao !== "yoda") {
      throw new Error("ID do salão não encontrado.");
    }

    // yoda sem salaoId -> pode optar por não carregar empresa única
    if (!salaoId && user?.funcao === "yoda") {
      yield put(loadMyCompanySuccess(null));
      return;
    }

    const { data } = yield call(api.get, `/salao/${salaoId}`);

    if (data?.error) {
      throw new Error(data?.message || "Erro ao carregar empresa.");
    }

    yield put(loadMyCompanySuccess(data.salao));
  } catch (err) {
    const message = getErrorMessage(err, "Erro ao carregar dados da empresa.");
    yield put(loadMyCompanyFailure(message));
    yield put(setAlerta({ open: true, tipo: "error", mensagem: message }));
  }
}

// -------- FORM DATA --------
function buildFormData({ data, logoFile, capaFile, apresentacaoFile }) {
  const fd = new FormData();

  // Campos simples
  fd.append("nome", data?.nome || "");
  fd.append("email", data?.email || "");
  fd.append("telefone", data?.telefone || "");

  // Endereço (backend lê em bracket notation)
  fd.append("endereco[logradouro]", data?.endereco?.logradouro || "");
  fd.append("endereco[bairro]", data?.endereco?.bairro || "");
  fd.append("endereco[cidade]", data?.endereco?.cidade || "");
  fd.append("endereco[uf]", data?.endereco?.uf || "");
  fd.append("endereco[cep]", data?.endereco?.cep || "");
  fd.append("endereco[numero]", data?.endereco?.numero || "");
  fd.append("endereco[pais]", data?.endereco?.pais || "");

  // Geo
  fd.append("geo[tipo]", data?.geo?.tipo || "Point");
  if (Array.isArray(data?.geo?.coordinates)) {
    data.geo.coordinates.forEach((c, i) => {
      if (c !== null && c !== undefined && c !== "") {
        fd.append(`geo[coordinates][${i}]`, String(c));
      }
    });
  }

  if (logoFile) fd.append("logo", logoFile);
  if (capaFile) fd.append("capa", capaFile);
  if (apresentacaoFile) fd.append("apresentacao", apresentacaoFile);

  return fd;
}

// -------- UPDATE --------
function* updateMyCompany({ payload }) {
  try {

    const formData = buildFormData(payload);

    const { user } = yield select((state) => state.colaborador);

    // Importante: não setar Content-Type manualmente
    // Axios define multipart/form-data com boundary corretamente
    const { data } = yield call(api.put, `/salao/${user?.salaoId}`, formData);

    if (data?.error) {
      throw new Error(data?.message || "Erro ao salvar empresa.");
    }

    yield put(updateMyCompanySuccess(data?.salao || data));

    yield put(
      setAlerta({
        open: true,
        tipo: "success",
        mensagem: "Dados da empresa atualizados com sucesso!",
      })
    );
  } catch (err) {
    const message = getErrorMessage(err, "Erro ao atualizar dados da empresa.");
    yield put(updateMyCompanyFailure(message));
    yield put(
      setAlerta({
        open: true,
        tipo: "error",
        mensagem: message,
      })
    );
  }
}

export default all([
  takeLatest(types.LOAD_MY_COMPANY_REQUEST, loadMyCompany),
  takeLatest(types.UPDATE_MY_COMPANY_REQUEST, updateMyCompany),
]);