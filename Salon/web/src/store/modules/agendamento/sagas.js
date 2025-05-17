import { takeLatest, all, call, put } from "redux-saga/effects";
import { updateAgendamento } from "./actions";
import api from "../../../services/api";
import consts from "../../../consts";
import types from "./types";

export function* filterAgendamentos({ start, end }) {
    //console.log('Disparou FILTER_AGENDAMENTOS', { start, end });
  try {
    const { data: res } = yield call(api.post, "/agendamento/filter", {
      salaoId: consts.salaoId,
      periodo: {
        inicio: start,
        final: end,
      },
    });

    console.log("Resposta da API:", res);

    if (res.error) {
      alert(res.message);
      return false;
    }

    yield put(updateAgendamento(res.agendamento));

  } catch (err) {
    alert(err.message);
  }
}

export default all([takeLatest(types.FILTER_AGENDAMENTOS, filterAgendamentos)]);
