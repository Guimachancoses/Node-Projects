import { combineReducers } from "redux";

import avaliacao from "./avaliacao/reducer";

const rootReducer = combineReducers({
  avaliacao,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
