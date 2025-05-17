import { takeLatest, all, call, put, select } from "redux-saga/effects";
import {
  updateColaborador,
  allColaboradores as allColaboradoresActrions,
  resetColaborador,
  setAlerta,
} from "./actions";
import types from "./types";
import api from "../../../services/api";
import consts from "../../../consts";

export function* allColaboradores() {
  const { form } = yield select((state) => state.colaborador);

  try {
    yield put(updateColaborador({ form: { ...form, filtering: true } }));
    const { data: res } = yield call(
      api.get,
      `/colaborador/salao/${consts.salaoId}`
    );

    yield put(updateColaborador({ form: { ...form, filtering: false } }));

    //console.log("Resposta da API:", res);

    if (res.error) {
      alert(res.message);
      return false;
    }

    yield put(updateColaborador({ colaboradores: res.colaboradores }));
  } catch (err) {
    yield put(updateColaborador({ form: { ...form, filtering: false } }));
    alert(err.message);
  }
}

export function* filterColaboradores({ filters }) {
  const { form } = yield select((state) => state.colaborador);

  try {
    yield put(updateColaborador({ form: { ...form, filtering: true } }));

    const { data: res } = yield call(api.post, "/colaborador/filter", filters);
    yield put(updateColaborador({ form: { ...form, filtering: false } }));

    //console.log("Resposta da API:", res);

    if (res.error) {
      alert(res.message);
      return false;
    }

    if (res.colaboradores.length > 0) {
      yield put(
        updateColaborador({
          colaborador: res.colaboradores[0],
          form: { ...form, filtering: false, disabled: true },
        })
      );
    } else {
      yield put(
        updateColaborador({
          form: { ...form, filtering: false, disabled: false },
        })
      );
    }
  } catch (err) {
    alert(err.message);
    yield put(updateColaborador({ form: { ...form, filtering: false } }));
  }
}

export function* addColaborador() {
  const { form, colaborador, components, behavior } = yield select(
    (state) => state.colaborador
  );

  try {
    yield put(updateColaborador({ form: { ...form, saving: true } }));
    let res = {};

    if (behavior === "create") {
      const response = yield call(api.post, "/colaborador", {
        salaoId: consts.salaoId,
        colaborador,
      });
      res = response.data;
    } else {
      const response = yield call(api.put, `/colaborador/${colaborador._id}`, {
        vinculo: colaborador.vinculo,
        vinculoId: colaborador.vinculoId,
        especialidades: colaborador.especialidades,
      });
      res = response.data;
    }

    
    yield put(updateColaborador({ form: { ...form, saving: false } }));

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

    yield put(allColaboradoresActrions());
    yield put(
      updateColaborador({ components: { ...components, drawer: false } })
    );
    yield put(resetColaborador());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message:
          behavior === "create"
            ? "Colaborador cadastrado com sucesso!"
            : "Colaborador atualizado com sucesso!",
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
    yield put(updateColaborador({ form: { ...form, saving: false } }));
  }
}

export function* unlinkColaborador({ vinculoId }) {
  const { form, components } = yield select((state) => state.colaborador);

  try {
    yield put(updateColaborador({ form: { ...form, saving: true } }));

    const { data: res } = yield call(
      api.delete,
      `/colaborador/vinculo/${vinculoId}`
    );

    yield put(
      updateColaborador({
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

    yield put(allColaboradoresActrions());
    yield put(
      updateColaborador({
        components: { ...components, drawer: false, confirmDelete: false },
      })
    );
    yield put(resetColaborador());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message: "Colaborador excluído!",
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
    yield put(updateColaborador({ form: { ...form, saving: false } }));
  }
}

export function* allServicos() {
  const { form } = yield select((state) => state.colaborador);

  try {
    yield put(updateColaborador({ form: { ...form, filtering: true } }));

    const { data: res } = yield call(
      api.get,
      `/salao/servicos/${consts.salaoId}`
    );

    yield put(updateColaborador({ form: { ...form, filtering: false } }));

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

    yield put(updateColaborador({ servicos: res.servicos }));

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
    yield put(updateColaborador({ form: { ...form, filtering: false } }));
  }
}

export default all([
  takeLatest(types.ALL_COLABORADORES, allColaboradores),
  takeLatest(types.FILTER_COLABORADORES, filterColaboradores),
  takeLatest(types.ADD_COLABORADOR, addColaborador),
  takeLatest(types.UNLINK_COLABORADOR, unlinkColaborador),
  takeLatest(types.ALL_SERVICOS, allServicos),
]);
