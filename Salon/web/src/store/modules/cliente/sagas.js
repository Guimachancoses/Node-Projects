import { takeLatest, all, call, put, select } from "redux-saga/effects";
import {
  updateCliente,
  allClientes as allClientesActrions,
  resetCliente,
  setAlerta,
} from "./actions";
import types from "./types";
import api from "../../../services/api";

const SALAOID = `${process.env.REACT_APP_SALAO_ID}`;

export function* allClientes() {
  const { form } = yield select((state) => state.cliente);

  try {
    yield put(updateCliente({ form: { ...form, filtering: true } }));
    const { data: res } = yield call(
      api.get,
      `/cliente/salao/${SALAOID}`
    );

    yield put(updateCliente({ form: { ...form, filtering: false } }));

    //console.log("Resposta da API:", res);

    if (res.error) {
      alert(res.message);
      return false;
    }

    yield put(updateCliente({ clientes: res.clientes }));
  } catch (err) {
    yield put(updateCliente({ form: { ...form, filtering: false } }));
    alert(err.message);
  }
}

export function* filterClientes({ filters }) {
  const { form } = yield select((state) => state.cliente);

  try {
    yield put(updateCliente({ form: { ...form, filtering: true } }));

    const { data: res } = yield call(api.post, "/cliente/filter", filters);
    yield put(updateCliente({ form: { ...form, filtering: false } }));

    //console.log("Resposta da API:", res);

    if (res.error) {
      alert(res.message);
      return false;
    }

    if (res.clientes.length > 0) {
      yield put(
        updateCliente({
          cliente: res.clientes[0],
          form: { ...form, filtering: false, disabled: true },
        })
      );
    } else {
      yield put(
        updateCliente({
          form: { ...form, filtering: false, disabled: false },
        })
      );
    }
  } catch (err) {
    alert(err.message);
    yield put(updateCliente({ form: { ...form, filtering: false } }));
  }
}

export function* addCliente() {
  const { form, cliente, components, behavior } = yield select((state) => state.cliente);

  try {
    yield put(updateCliente({ form: { ...form, saving: true } }));
    let res = {};

    if (behavior === "create") {
      const response = yield call(api.post, "/cliente", {
        salaoId: SALAOID,
        cliente,
      });
      res = response.data;
    } else {
      const response = yield call(api.put, `/cliente/${cliente._id}`, {
        telefone: {
          area: cliente.area,
          numero: cliente.numero,
        },
      });
      res = response.data;
    }

    
    yield put(updateCliente({ form: { ...form, saving: false } }));

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

    yield put(allClientesActrions());
    yield put(updateCliente({ components: { ...components, drawer: false } }));
    yield put(resetCliente());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message:
          behavior === "create"
            ? "Cliente cadastrado com sucesso!"
            : "Cliente atualizado com sucesso!",
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
    yield put(updateCliente({ form: { ...form, saving: false } }));
  }
}

export function* unlinkCliente({ vinculoId }) {
  const { form, components } = yield select((state) => state.cliente);

  try {
    yield put(updateCliente({ form: { ...form, saving: true } }));

    const { data: res } = yield call(
      api.delete,
      `/cliente/vinculo/${vinculoId}`
    );

    yield put(
      updateCliente({
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

    yield put(allClientesActrions());
    yield put(
      updateCliente({
        components: { ...components, drawer: false, confirmDelete: false },
      })
    );
    yield put(resetCliente());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message: "Cliente excluído!",
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
    yield put(updateCliente({ form: { ...form, saving: false } }));
  }
}

export default all([
  takeLatest(types.ALL_CLIENTES, allClientes),
  takeLatest(types.FILTER_CLIENTES, filterClientes),
  takeLatest(types.ADD_CLIENTE, addCliente),
  takeLatest(types.UNLINK_CLIENTE, unlinkCliente),
]);
