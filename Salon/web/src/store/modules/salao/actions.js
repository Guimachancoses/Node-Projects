import types from "./types";

export function loadMyCompanyRequest() {
  return { type: types.LOAD_MY_COMPANY_REQUEST };
}
export function loadMyCompanySuccess(empresa) {
  return { type: types.LOAD_MY_COMPANY_SUCCESS, payload: { empresa } };
}
export function loadMyCompanyFailure(error) {
  return { type: types.LOAD_MY_COMPANY_FAILURE, payload: { error } };
}

export function updateMyCompanyRequest(payload) {
  // payload: { data, logoFile?, capaFile? }
  return { type: types.UPDATE_MY_COMPANY_REQUEST, payload };
}
export function updateMyCompanySuccess(empresa) {
  return { type: types.UPDATE_MY_COMPANY_SUCCESS, payload: { empresa } };
}
export function updateMyCompanyFailure(error) {
  return { type: types.UPDATE_MY_COMPANY_FAILURE, payload: { error } };
}