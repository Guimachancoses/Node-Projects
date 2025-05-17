import { all } from "redux-saga/effects";

import agendamento from "./agendamento/sagas";
import cliente from "./cliente/sagas";
import colaborador from "./colaborador/sagas";
import servico from "./servico/sagas";
import horario from "./horario/sagas";

export default function* rootSaga() {
  return yield all([agendamento, cliente, colaborador, servico, horario]);
}
