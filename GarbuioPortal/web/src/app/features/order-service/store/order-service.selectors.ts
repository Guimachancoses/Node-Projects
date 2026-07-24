import { AppState } from '../../../core/state/app-state';
import { RequestState } from '../models/order-service.models';

const selectFeature = (state: AppState) => state.orderService;

export const selectSearchReferenceData = (state: AppState) =>
  selectFeature(state).searchReferenceData;
export const selectActiveFilter = (state: AppState) => selectFeature(state).activeFilter;
export const selectOrders = (state: AppState) => selectFeature(state).orders;
export const selectOrderPagination = (state: AppState) => selectFeature(state).orderPagination;
export const selectEditor = (state: AppState) => selectFeature(state).editor;
export const selectLastSaveResult = (state: AppState) => selectFeature(state).lastSaveResult;
export const selectSupplyEditor = (state: AppState) => selectFeature(state).supplyEditor;
export const selectLookupItems = (state: AppState) => selectFeature(state).lookupItems;
export const selectLookupPagination = (state: AppState) => selectFeature(state).lookupPagination;
export const selectInitializeRequest = (state: AppState): RequestState =>
  selectFeature(state).initializeRequest;
export const selectSearchRequest = (state: AppState): RequestState =>
  selectFeature(state).searchRequest;
export const selectEditorRequest = (state: AppState): RequestState =>
  selectFeature(state).editorRequest;
export const selectSaveRequest = (state: AppState): RequestState =>
  selectFeature(state).saveRequest;
export const selectSupplyEditorRequest = (state: AppState): RequestState =>
  selectFeature(state).supplyEditorRequest;
export const selectSaveSupplyRequest = (state: AppState): RequestState =>
  selectFeature(state).saveSupplyRequest;
export const selectDeleteSupplyRequest = (state: AppState): RequestState =>
  selectFeature(state).deleteSupplyRequest;
export const selectLookupRequestState = (state: AppState): RequestState =>
  selectFeature(state).lookupRequestState;
export const selectSearchBusy = (state: AppState) =>
  selectFeature(state).initializeRequest.status === 'loading' ||
  selectFeature(state).searchRequest.status === 'loading';
export const selectEditorBusy = (state: AppState) =>
  selectFeature(state).editorRequest.status === 'loading' ||
  selectFeature(state).saveRequest.status === 'loading' ||
  selectFeature(state).supplyEditorRequest.status === 'loading' ||
  selectFeature(state).saveSupplyRequest.status === 'loading' ||
  selectFeature(state).deleteSupplyRequest.status === 'loading';
