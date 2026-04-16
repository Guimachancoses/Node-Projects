import { takeLatest, all, call, put, select } from "redux-saga/effects";
import {
  updateColaborador,
  allColaboradores as allColaboradoresActrions,
  resetColaborador,
  setAlerta,
  updateUser,
} from "./actions";
import types from "./types";
import api from "../../../services/api";
import history from "../../../history";
import { signOutClerk } from "../../../utils/clerk";
import { delay } from "redux-saga/effects";

const SALAOID = `${process.env.REACT_APP_SALAO_ID}`;

export function* allColaboradores() {
  const { form } = yield select((state) => state.colaborador);

  try {
    yield put(updateColaborador({ form: { ...form, filtering: true } }));
    const { data: res } = yield call(
      api.get,
      `/colaborador/salao/${SALAOID}`
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
        salaoId: SALAOID,
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
      `/salao/servicos/${SALAOID}`
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

export function* checkUser() {
  const { user } = yield select((state) => state.colaborador);

  try {
    console.log("userSagas: ", user);
    const { data: res } = yield call(api.get, `/colaborador/check/${user.email}`);

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

    console.log("res API: ", res);

    if (res.colaborador) {
      yield put(updateUser({ user: res.colaborador }));
      history.push("/agendamentos");
    } else {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: "Colaborador não cadastrado no sistema! Fale com o administrador!",
        })
      );
      
      yield delay(5000); // espera 2 segundos para o usuário ver o alerta
      
      yield call(signOutClerk);
      history.push("/");
    }
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
  }
}


export default all([
  takeLatest(types.ALL_COLABORADORES, allColaboradores),
  takeLatest(types.FILTER_COLABORADORES, filterColaboradores),
  takeLatest(types.ADD_COLABORADOR, addColaborador),
  takeLatest(types.UNLINK_COLABORADOR, unlinkColaborador),
  takeLatest(types.ALL_SERVICOS, allServicos),
  takeLatest(types.CHECK_USER, checkUser),
]);
