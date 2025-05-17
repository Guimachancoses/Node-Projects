import { takeLatest, all, call, put, select } from "redux-saga/effects";
import {
  updateServico,
  allServicos as allServicosActions,
  resetServico,
  setAlerta,
} from "./actions";
import types from "./types";
import api from "../../../services/api";
import consts from "../../../consts";

export function* allServicos() {
  const { form } = yield select((state) => state.servico);

  try {
    yield put(updateServico({ form: { ...form, filtering: true } }));
    const { data: res } = yield call(
      api.get,
      `/servico/salao/${consts.salaoId}`
    );

    yield put(updateServico({ form: { ...form, filtering: false } }));

    console.log("Resposta da API:", res);

    if (res.error) {
      alert(res.message);
      return false;
    }

    yield put(updateServico({ servicos: res.servicos }));
  } catch (err) {
    yield put(updateServico({ form: { ...form, filtering: false } }));
    alert(err.message);
  }
}

export function* addServicos() {
  const { form, servico, components, behavior } = yield select(
    (state) => state.servico
  );

  try {
    yield put(updateServico({ form: { ...form, saving: true } }));
    //console.log("salaoId:", consts.salaoId); // Verifique se o valor é correto antes de enviar

    const formData = new FormData();

    formData.append("salaoId", consts.salaoId);
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

    console.log("Resposta da API:", res);

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
  console.log("Está removendo: " + key)
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

    console.log("Resposta da API:", res);

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
