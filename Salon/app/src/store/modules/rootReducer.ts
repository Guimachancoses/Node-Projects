// store/modules/rootReducer.ts
import { combineReducers } from 'redux';

import salao from './salao/reducer';
import cliente from './cliente/reducer';
// importe outros reducers aqui quando tiver

const rootReducer = combineReducers({
  salao,
  cliente,
  // outros reducers...
});

export default rootReducer;
