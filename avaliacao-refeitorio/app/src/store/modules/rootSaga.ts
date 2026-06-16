import { all } from "redux-saga/effects";

import avaliacaoSaga from "./avaliacao/sagas";

export default function* rootSaga() {
  yield all([avaliacaoSaga()]);
}
