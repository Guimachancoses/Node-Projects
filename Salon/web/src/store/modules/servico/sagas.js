import { takeLatest, all, call, put, select } from "redux-saga/effects";
import {
  updateServico,
  allServicos as allServicosActions,
  resetServico,
  setAlerta,
} from "./actions";
import types from "./types";
import api from "../../../services/api";


export function* allServicos() {
  const { form } = yield select((state) => state.servico);
  const { user } = yield select((state) => state.colaborador);

  const isYoda = user?.funcao === "yoda";
  const salaoId = user?.salaoId;

  try {
    if (!isYoda && !salaoId) {
      throw new Error("Salão não identificado para carregar os serviços.");
    }

    yield put(updateServico({ form: { ...form, filtering: true } }));

    const endpoint = isYoda
      ? "/servico/all"
      : `/servico/salao/${encodeURIComponent(salaoId)}`;

    const { data: res } = yield call(api.get, endpoint);

    if (res.error) {
      alert(res.message);
      return false;
    }

    yield put(updateServico({ servicos: res.servicos || [] }));
  } catch (err) {
    alert(err.message);
  } finally {
    yield put(updateServico({ form: { ...form, filtering: false } }));
  }
}

export function* addServicos() {
  const { form, servico, components, behavior } = yield select(
    (state) => state.servico
  );

  try {
    yield put(updateServico({ form: { ...form, saving: true } }));
    const { user: userRaw } = yield select((state) => state.colaborador);
    //console.log("salaoId:", consts.salaoId); // Verifique se o valor é correto antes de enviar

    const salaoId = userRaw?.salaoId;
    const formData = new FormData();

    formData.append("salaoId", salaoId);
    formData.append("servico", JSON.stringify(servico));
    servico.arquivos.forEach((arquivo, index) => {
      formData.append(`arquivo_${index}`, arquivo);
    });

    // for (let [key, value] of formData.entries()) {
    //   console.log(`Este é o formData - ${key}: ${value}`);
    // }

    const { data: res } = yield call(
      api[behavior === "create" ? "post" : "put"],
      behavior === "create" ? `/servico` : `/servico/${servico._id}`,
      formData
    );

    yield put(updateServico({ form: { ...form, saving: false } }));

    //console.log("Resposta da API:", res);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message,
        })
      );
      return false;
    }

    yield put(allServicosActions());
    yield put(updateServico({ components: { ...components, drawer: false } }));
    yield put(resetServico());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message:
          behavior === "create"
            ? "Serviço cadastrado com sucesso!"
            : "Serviço atualizado com sucesso!",
      })
    );

    // dispara o alerta de sucesso
  } catch (err) {
    // dispara o alerta de erro:
    yield put(
      setAlerta({
        open: true,
        severity: "error",
        title: "Erro",
        message: err.message,
      })
    );
    yield put(updateServico({ form: { ...form, saving: false } }));
  }
}

export function* removeServico({ vinculoId }) {
  const { form, components } = yield select((state) => state.servico);

  try {
    yield put(updateServico({ form: { ...form, saving: true } }));

    const { data: res } = yield call(
      api.delete,
      `/servico/${vinculoId}`
    );

    yield put(
      updateServico({
        form: { ...form, saving: false },
      })
    );

    //console.log("Resposta da API:", res);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message,
        })
      );
      return false;
    }

    yield put(allServicosActions());
    yield put(
      updateServico({
        components: { ...components, drawer: false, confirmDelete: false },
      })
    );
    yield put(resetServico());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message: "Serviço excluído!",
      })
    );

    // dispara o alerta de sucesso
  } catch (err) {
    // dispara o alerta de erro:
    yield put(
      setAlerta({
        open: true,
        severity: "error",
        title: "Erro",
        message: err.message,
      })
    );
    yield put(updateServico({ form: { ...form, saving: false } }));
  }
}

export function* removeArquivo({ key }) {
  //console.log("Está removendo: " + key)
  const { form, components } = yield select((state) => state.servico);

  try {
    yield put(updateServico({ form: { ...form, saving: true } }));

    const { data: res } = yield call(api.post, `/servico/delete-arquivo`, {
      key,
    });

    yield put(
      updateServico({
        form: { ...form, saving: false },
      })
    );

    //console.log("Resposta da API:", res);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message,
        })
      );
      return false;
    }

    yield put(allServicosActions());
    yield put(
      updateServico({
        components: { ...components, drawer: false, confirmDelete: false },
      })
    );
    yield put(resetServico());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message: "Arquivo excluído!",
      })
    );

    // dispara o alerta de sucesso
  } catch (err) {
    // dispara o alerta de erro:
    yield put(
      setAlerta({
        open: true,
        severity: "error",
        title: "Erro",
        message: err.message,
      })
    );
    yield put(updateServico({ form: { ...form, saving: false } }));
  }
}

export default all([
  takeLatest(types.ALL_SERVICOS, allServicos),
  takeLatest(types.ADD_SERVICO, addServicos),
  takeLatest(types.REMOVE_SERVICO, removeServico),
  takeLatest(types.REMOVE_ARQUIVO, removeArquivo),
]);
