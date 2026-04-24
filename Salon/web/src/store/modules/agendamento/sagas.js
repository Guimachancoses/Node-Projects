import { takeLatest, all, call, put, select } from "redux-saga/effects";
import moment from "moment";
import api from "../../../services/api";
import types from "./types";
import {
  updateAgendamento,
  updateAgendamentoState,
  updateServicosAgendamento,
  updateClientesAgendamento,
  setAlerta,
  filterAgendamentos as filterAgendamentosAction,
} from "./actions";

const SALAOID = `${process.env.REACT_APP_SALAO_ID}`;

/**
 * Helper para atualizar loading do form no state.agendamento
 */
function* setLoading(loading) {
  const { form } = yield select((state) => state.agendamento);
  yield put(
    updateAgendamentoState({
      form: { ...form, loading },
    })
  );
}

/**
 * Lista agendamentos por período
 */
export function* filterAgendamentos({ start, end }) {
  try {
    yield* setLoading(true);

    const { data: res } = yield call(api.post, "/agendamento/filter", {
      salaoId: SALAOID,
      periodo: {
        inicio: start,
        final: end,
      },
    });

    yield* setLoading(false);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message || "Não foi possível carregar os agendamentos.",
        })
      );
      return;
    }

    yield put(updateAgendamento(res.agendamento || []));
  } catch (err) {
    yield* setLoading(false);
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

/**
 * Carrega serviços para Select no Drawer de agendamento
 */
export function* allServicosAgendamento() {
  try {
    const { data: res } = yield call(api.get, `/servico/salao/${SALAOID}`);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message || "Não foi possível carregar os serviços.",
        })
      );
      return;
    }

    const servicos = (res.servicos || []).map((s) => ({
      value: s._id,
      label: s.titulo,
      ...s,
    }));

    yield put(updateServicosAgendamento(servicos));
  } catch (err) {
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

/**
 * Carrega clientes para Select no Drawer de agendamento
 */
export function* allClientesAgendamento() {
  try {
    const { data: res } = yield call(api.get, `/cliente/salao/${SALAOID}`);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message || "Não foi possível carregar os clientes.",
        })
      );
      return;
    }

    const clientes = (res.clientes || []).map((c) => ({
      value: c._id,
      label: `${c.nome || ""} ${c.sobrenome || ""}`.trim(),
      ...c,
    }));

    yield put(updateClientesAgendamento(clientes));
  } catch (err) {
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

/**
 * Cria agendamento
 */
export function* createAgendamento({ payload }) {
  const { components } = yield select((state) => state.agendamento);

  try {
    yield* setLoading(true);

    const { data: res } = yield call(api.post, "/agendamento", {
      salaoId: SALAOID,
      ...payload,
    });

    yield* setLoading(false);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message || "Não foi possível criar o agendamento.",
        })
      );
      return;
    }

    yield put(
      updateAgendamentoState({
        components: { ...components, drawer: false },
        behavior: "view",
      })
    );

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message: "Agendamento criado com sucesso!",
      })
    );

    yield put(
      filterAgendamentosAction(
        moment().weekday(0).format("YYYY-MM-DD"),
        moment().weekday(6).format("YYYY-MM-DD")
      )
    );
  } catch (err) {
    yield* setLoading(false);
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

/**
 * Edita agendamento
 */
export function* editAgendamento({ payload }) {
  const { components } = yield select((state) => state.agendamento);

  try {
    yield* setLoading(true);

    // ajuste endpoint se seu backend usar outra rota
    const { data: res } = yield call(api.put, `/agendamento/${payload._id}`, payload);

    yield* setLoading(false);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message || "Não foi possível atualizar o agendamento.",
        })
      );
      return;
    }

    yield put(
      updateAgendamentoState({
        components: { ...components, drawer: false },
        behavior: "view",
      })
    );

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message: "Agendamento atualizado com sucesso!",
      })
    );

    yield put(
      filterAgendamentosAction(
        moment().weekday(0).format("YYYY-MM-DD"),
        moment().weekday(6).format("YYYY-MM-DD")
      )
    );
  } catch (err) {
    yield* setLoading(false);
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

/**
 * Exclui agendamento
 */
export function* deleteAgendamento({ id }) {
  const { components } = yield select((state) => state.agendamento);

  try {
    yield* setLoading(true);

    // ajuste endpoint se seu backend usar outra rota
    const { data: res } = yield call(api.delete, `/agendamento/${id}`);

    yield* setLoading(false);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message || "Não foi possível excluir o agendamento.",
        })
      );
      return;
    }

    yield put(
      updateAgendamentoState({
        components: { ...components, drawer: false, confirmDelete: false },
      })
    );

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message: "Agendamento excluído com sucesso!",
      })
    );

    yield put(
      filterAgendamentosAction(
        moment().weekday(0).format("YYYY-MM-DD"),
        moment().weekday(6).format("YYYY-MM-DD")
      )
    );
  } catch (err) {
    yield* setLoading(false);
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
  takeLatest(types.FILTER_AGENDAMENTOS, filterAgendamentos),
  takeLatest(types.ALL_SERVICOS_REQUEST, allServicosAgendamento),
  takeLatest(types.ALL_CLIENTES_REQUEST, allClientesAgendamento),
  takeLatest(types.CREATE_AGENDAMENTO_REQUEST, createAgendamento),
  takeLatest(types.EDIT_AGENDAMENTO_REQUEST, editAgendamento),
  takeLatest(types.DELETE_AGENDAMENTO_REQUEST, deleteAgendamento),
]);