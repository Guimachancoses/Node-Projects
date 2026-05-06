import { combineReducers } from "redux";

import agendamento from "./agendamento/reducer";
import cliente from "./cliente/reducer";
import colaborador from "./colaborador/reducer";
import servico from "./servico/reducer";
import horario from "./horario/reducer";
import salao from "./salao/reducer";

export default combineReducers({
  agendamento,
  cliente,
  colaborador,
  servico,
  horario,
  salao,
});
