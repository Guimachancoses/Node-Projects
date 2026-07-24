import { RequestState } from '../models/order-service.models';
import { OrderServiceAction } from './order-service.actions';
import {
  initialOrderServiceState,
  initialPaginationState,
  OrderServiceState,
} from './order-service.state';
import { OrderServiceActionTypes as Types } from './order-service.types';

const loading = (): RequestState => ({ status: 'loading', error: null });
const success = (): RequestState => ({ status: 'success', error: null });

export function orderServiceReducer(
  state: OrderServiceState = initialOrderServiceState,
  action: OrderServiceAction,
): OrderServiceState {
  switch (action.type) {
    case Types.INITIALIZE_SEARCH_REQUESTED:
      return { ...state, initializeRequest: loading() };
    case Types.INITIALIZE_SEARCH_SUCCEEDED:
      return {
        ...state,
        searchReferenceData: action.payload,
        activeFilter: action.payload.initialFilter,
        initializeRequest: success(),
      };
    case Types.INITIALIZE_SEARCH_FAILED:
      return {
        ...state,
        initializeRequest: { status: 'error', error: action.payload },
      };
    case Types.SEARCH_REQUESTED:
      return {
        ...state,
        activeFilter: action.payload.filter,
        searchRequest: loading(),
      };
    case Types.SEARCH_SUCCEEDED:
      return {
        ...state,
        orders: action.payload.items,
        activeFilter: action.request.filter,
        orderPagination: {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          hasNext: action.payload.hasNext,
        },
        searchRequest: success(),
      };
    case Types.SEARCH_FAILED:
      return { ...state, searchRequest: { status: 'error', error: action.payload } };
    case Types.LOAD_EDITOR_REQUESTED:
      return { ...state, editorRequest: loading(), lastSaveResult: null };
    case Types.LOAD_EDITOR_SUCCEEDED:
      return { ...state, editor: action.payload, editorRequest: success() };
    case Types.LOAD_EDITOR_FAILED:
      return { ...state, editorRequest: { status: 'error', error: action.payload } };
    case Types.SAVE_REQUESTED:
      return { ...state, saveRequest: loading(), lastSaveResult: null };
    case Types.SAVE_SUCCEEDED:
      return { ...state, lastSaveResult: action.payload, saveRequest: success() };
    case Types.SAVE_FAILED:
      return { ...state, saveRequest: { status: 'error', error: action.payload } };
    case Types.RESET_SAVE_RESULT:
      return { ...state, lastSaveResult: null };
    case Types.LOAD_SUPPLY_EDITOR_REQUESTED:
      return { ...state, supplyEditorRequest: loading(), supplyEditor: null };
    case Types.LOAD_SUPPLY_EDITOR_SUCCEEDED:
      return {
        ...state,
        supplyEditor: action.payload,
        supplyEditorRequest: success(),
      };
    case Types.LOAD_SUPPLY_EDITOR_FAILED:
      return {
        ...state,
        supplyEditorRequest: { status: 'error', error: action.payload },
      };
    case Types.CLOSE_SUPPLY_EDITOR:
      return {
        ...state,
        supplyEditor: null,
        supplyEditorRequest: { status: 'idle', error: null },
      };
    case Types.SAVE_SUPPLY_REQUESTED:
      return { ...state, saveSupplyRequest: loading() };
    case Types.SAVE_SUPPLY_SUCCEEDED:
      return {
        ...state,
        supplyEditor: null,
        saveSupplyRequest: success(),
      };
    case Types.SAVE_SUPPLY_FAILED:
      return {
        ...state,
        saveSupplyRequest: { status: 'error', error: action.payload },
      };
    case Types.DELETE_SUPPLY_REQUESTED:
      return { ...state, deleteSupplyRequest: loading() };
    case Types.DELETE_SUPPLY_SUCCEEDED:
      return { ...state, deleteSupplyRequest: success() };
    case Types.DELETE_SUPPLY_FAILED:
      return {
        ...state,
        deleteSupplyRequest: { status: 'error', error: action.payload },
      };
    case Types.LOOKUP_REQUESTED:
      return {
        ...state,
        lookupRequest: action.payload,
        lookupItems: [],
        lookupPagination: {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          hasNext: false,
        },
        lookupRequestState: loading(),
      };
    case Types.LOOKUP_SUCCEEDED:
      return {
        ...state,
        lookupRequest: action.request,
        lookupItems: action.payload.items,
        lookupPagination: {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          hasNext: action.payload.hasNext,
        },
        lookupRequestState: success(),
      };
    case Types.LOOKUP_FAILED:
      return {
        ...state,
        lookupRequestState: { status: 'error', error: action.payload },
      };
    case Types.CLEAR_LOOKUP:
      return {
        ...state,
        lookupRequest: null,
        lookupItems: [],
        lookupPagination: initialPaginationState,
        lookupRequestState: { status: 'idle', error: null },
      };
    default:
      return state;
  }
}
