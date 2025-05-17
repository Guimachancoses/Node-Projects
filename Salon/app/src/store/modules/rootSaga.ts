import { all } from 'redux-saga/effects';
import salao from './salao/sagas';
import cliente from './cliente/sagas';
// Ex: import userSaga from './user/sagas'; (se tiver outros módulos)

export default function* rootSaga() {
  yield all([
    salao,
    cliente
    // userSaga(), // outros módulos aqui
  ]);
}
