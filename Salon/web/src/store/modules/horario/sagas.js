import { takeLatest, all, call, put, select } from "redux-saga/effects";
import {
  updateHorario,
  allHorarios as allHorariosActions,
  resetHorario,
  setAlerta,
} from "./actions";
import types from "./types";
import api from "../../../services/api";
import consts from "../../../consts";

export function* allHorarios() {
  const { form } = yield select((state) => state.horario);

  try {
    yield put(updateHorario({ form: { ...form, filtering: true } }));
    const { data: res } = yield call(
      api.get,
      `/horario/salao/${consts.salaoId}`
    );

    yield put(updateHorario({ form: { ...form, filtering: false } }));

    //console.log("Resposta da API:", res);

    if (res.error) {
      alert(res.message);
      return false;
    }

    yield put(updateHorario({ horarios: res.horarios }));
  } catch (err) {
    yield put(updateHorario({ form: { ...form, filtering: false } }));
    alert(err.message);
  }
}

export function* filterColaboradores() {
  const { form, horario } = yield select((state) => state.horario);

  try {
    yield put(updateHorario({ form: { ...form, filtering: true } }));

    const { data: res } = yield call(api.post, "/horario/colaboradores", {
      especialidades: horario.especialidades,
      salaoId: consts.salaoId,
    });
    yield put(updateHorario({ form: { ...form, filtering: false } }));

    //console.log("Resposta da API:", res);

    if (res.error) {
      alert(res.message);
      return false;
    }

    yield put(
      updateHorario({
        colaboradores: res.listaColaboradores,
        form: { ...form, filtering: false, disabled: true },
      })
    );
  } catch (err) {
    alert(err.message);
    yield put(updateHorario({ form: { ...form, filtering: false } }));
  }
}

export function* addHorario() {
  const { form, horario, components, behavior } = yield select(
    (state) => state.horario
  );

  try {
    yield put(updateHorario({ form: { ...form, saving: true } }));
    let res = {};

    if (behavior === "create") {
      const response = yield call(api.post, "/horario", {
        salaoId: consts.salaoId,
        ...horario,
      });
      res = response.data;
    } else {
      const response = yield call(api.put, `/horario/${horario._id}`, horario);
      res = response.data;
    }

    yield put(updateHorario({ form: { ...form, saving: false } }));

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

    yield put(allHorariosActions());
    yield put(updateHorario({ components: { ...components, drawer: false } }));
    yield put(resetHorario());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message:
          behavior === "create"
            ? "Horário cadastrado com sucesso!"
            : "Horário atualizado com sucesso!",
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
    yield put(updateHorario({ form: { ...form, saving: false } }));
  }
}

export function* removeHorario() {
  const { form, horario, components } = yield select((state) => state.horario);

  try {
    yield put(updateHorario({ form: { ...form, saving: true } }));

    const { data: res } = yield call(
      api.delete,
      `/horario/${horario._id}`
    );

    yield put(
      updateHorario({
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

    yield put(allHorariosActions());
    yield put(
      updateHorario({
        components: { ...components, drawer: false, confirmDelete: false },
      })
    );
    yield put(resetHorario());

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
    yield put(updateHorario({ form: { ...form, saving: false } }));
  }
}

export function* allServicos() {
  const { form } = yield select((state) => state.horario);

  try {
    yield put(updateHorario({ form: { ...form, filtering: true } }));

    const { data: res } = yield call(
      api.get,
      `/salao/servicos/${consts.salaoId}`
    );

    yield put(updateHorario({ form: { ...form, filtering: false } }));

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

    yield put(updateHorario({ servicos: res.servicos }));
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
    yield put(updateHorario({ form: { ...form, filtering: false } }));
  }
}

export default all([
  takeLatest(types.ALL_HORARIOS, allHorarios),
  takeLatest(types.ALL_SERVICOS, allServicos),
  takeLatest(types.FILTER_COLABORADORES, filterColaboradores),
  takeLatest(types.ADD_HORARIO, addHorario),
  takeLatest(types.REMOVE_HORARIO, removeHorario),
]);
