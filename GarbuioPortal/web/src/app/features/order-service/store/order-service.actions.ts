import { ApiError } from '../../../core/errors/api-error';
import {
  DeleteSupplyRequest,
  LookupItem,
  LookupRequest,
  OrderEditorData,
  OrderListItem,
  OrderSearchRequest,
  OrderSearchReferenceData,
  PaginatedResult,
  SaveOrderRequest,
  SaveOrderResult,
  SaveSupplyRequest,
  SaveSupplyResult,
  SupplyEditorData,
} from '../models/order-service.models';
import { OrderServiceActionTypes as Types } from './order-service.types';

export const initializeSearchRequested = () =>
  ({
    type: Types.INITIALIZE_SEARCH_REQUESTED,
  }) as const;

export const initializeSearchSucceeded = (payload: OrderSearchReferenceData) =>
  ({
    type: Types.INITIALIZE_SEARCH_SUCCEEDED,
    payload,
  }) as const;

export const initializeSearchFailed = (payload: ApiError) =>
  ({
    type: Types.INITIALIZE_SEARCH_FAILED,
    payload,
  }) as const;

export const searchRequested = (payload: OrderSearchRequest) =>
  ({
    type: Types.SEARCH_REQUESTED,
    payload,
  }) as const;

export const searchSucceeded = (
  payload: PaginatedResult<OrderListItem>,
  request: OrderSearchRequest,
) =>
  ({
    type: Types.SEARCH_SUCCEEDED,
    payload,
    request,
  }) as const;

export const searchFailed = (payload: ApiError) =>
  ({
    type: Types.SEARCH_FAILED,
    payload,
  }) as const;

export interface LoadOrderEditorPayload {
  readonly branch?: string;
  readonly order?: string;
}

export const loadEditorRequested = (payload: LoadOrderEditorPayload = {}) =>
  ({
    type: Types.LOAD_EDITOR_REQUESTED,
    payload,
  }) as const;

export const loadEditorSucceeded = (payload: OrderEditorData) =>
  ({
    type: Types.LOAD_EDITOR_SUCCEEDED,
    payload,
  }) as const;

export const loadEditorFailed = (payload: ApiError) =>
  ({
    type: Types.LOAD_EDITOR_FAILED,
    payload,
  }) as const;

export const saveRequested = (payload: SaveOrderRequest) =>
  ({
    type: Types.SAVE_REQUESTED,
    payload,
  }) as const;

export const saveSucceeded = (payload: SaveOrderResult) =>
  ({
    type: Types.SAVE_SUCCEEDED,
    payload,
  }) as const;

export const saveFailed = (payload: ApiError) =>
  ({
    type: Types.SAVE_FAILED,
    payload,
  }) as const;

export const resetSaveResult = () =>
  ({
    type: Types.RESET_SAVE_RESULT,
  }) as const;

export interface LoadSupplyEditorPayload {
  readonly branch: string;
  readonly order: string;
  readonly orderServiceId: number;
  readonly sequence?: number;
}

export const loadSupplyEditorRequested = (payload: LoadSupplyEditorPayload) =>
  ({
    type: Types.LOAD_SUPPLY_EDITOR_REQUESTED,
    payload,
  }) as const;

export const loadSupplyEditorSucceeded = (payload: SupplyEditorData) =>
  ({
    type: Types.LOAD_SUPPLY_EDITOR_SUCCEEDED,
    payload,
  }) as const;

export const loadSupplyEditorFailed = (payload: ApiError) =>
  ({
    type: Types.LOAD_SUPPLY_EDITOR_FAILED,
    payload,
  }) as const;

export const closeSupplyEditor = () =>
  ({
    type: Types.CLOSE_SUPPLY_EDITOR,
  }) as const;

export const saveSupplyRequested = (payload: SaveSupplyRequest) =>
  ({
    type: Types.SAVE_SUPPLY_REQUESTED,
    payload,
  }) as const;

export const saveSupplySucceeded = (payload: SaveSupplyResult) =>
  ({
    type: Types.SAVE_SUPPLY_SUCCEEDED,
    payload,
  }) as const;

export const saveSupplyFailed = (payload: ApiError) =>
  ({
    type: Types.SAVE_SUPPLY_FAILED,
    payload,
  }) as const;

export const deleteSupplyRequested = (payload: DeleteSupplyRequest) =>
  ({
    type: Types.DELETE_SUPPLY_REQUESTED,
    payload,
  }) as const;

export const deleteSupplySucceeded = (payload: DeleteSupplyRequest) =>
  ({
    type: Types.DELETE_SUPPLY_SUCCEEDED,
    payload,
  }) as const;

export const deleteSupplyFailed = (payload: ApiError) =>
  ({
    type: Types.DELETE_SUPPLY_FAILED,
    payload,
  }) as const;

export const lookupRequested = (payload: LookupRequest) =>
  ({
    type: Types.LOOKUP_REQUESTED,
    payload,
  }) as const;

export const lookupSucceeded = (payload: PaginatedResult<LookupItem>, request: LookupRequest) =>
  ({
    type: Types.LOOKUP_SUCCEEDED,
    payload,
    request,
  }) as const;

export const lookupFailed = (payload: ApiError) =>
  ({
    type: Types.LOOKUP_FAILED,
    payload,
  }) as const;

export const clearLookup = () =>
  ({
    type: Types.CLEAR_LOOKUP,
  }) as const;

export type OrderServiceAction =
  | ReturnType<typeof initializeSearchRequested>
  | ReturnType<typeof initializeSearchSucceeded>
  | ReturnType<typeof initializeSearchFailed>
  | ReturnType<typeof searchRequested>
  | ReturnType<typeof searchSucceeded>
  | ReturnType<typeof searchFailed>
  | ReturnType<typeof loadEditorRequested>
  | ReturnType<typeof loadEditorSucceeded>
  | ReturnType<typeof loadEditorFailed>
  | ReturnType<typeof saveRequested>
  | ReturnType<typeof saveSucceeded>
  | ReturnType<typeof saveFailed>
  | ReturnType<typeof resetSaveResult>
  | ReturnType<typeof loadSupplyEditorRequested>
  | ReturnType<typeof loadSupplyEditorSucceeded>
  | ReturnType<typeof loadSupplyEditorFailed>
  | ReturnType<typeof closeSupplyEditor>
  | ReturnType<typeof saveSupplyRequested>
  | ReturnType<typeof saveSupplySucceeded>
  | ReturnType<typeof saveSupplyFailed>
  | ReturnType<typeof deleteSupplyRequested>
  | ReturnType<typeof deleteSupplySucceeded>
  | ReturnType<typeof deleteSupplyFailed>
  | ReturnType<typeof lookupRequested>
  | ReturnType<typeof lookupSucceeded>
  | ReturnType<typeof lookupFailed>
  | ReturnType<typeof clearLookup>;
