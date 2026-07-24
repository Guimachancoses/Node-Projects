import {
  LookupItem,
  LookupRequest,
  OrderEditorData,
  OrderFilter,
  OrderListItem,
  OrderSearchReferenceData,
  PaginationState,
  RequestState,
  SaveOrderResult,
  SupplyEditorData,
} from '../models/order-service.models';

export interface OrderServiceState {
  readonly searchReferenceData: OrderSearchReferenceData | null;
  readonly activeFilter: OrderFilter | null;
  readonly orders: ReadonlyArray<OrderListItem>;
  readonly orderPagination: PaginationState;
  readonly editor: OrderEditorData | null;
  readonly lastSaveResult: SaveOrderResult | null;
  readonly supplyEditor: SupplyEditorData | null;
  readonly lookupItems: ReadonlyArray<LookupItem>;
  readonly lookupPagination: PaginationState;
  readonly lookupRequest: LookupRequest | null;
  readonly initializeRequest: RequestState;
  readonly searchRequest: RequestState;
  readonly editorRequest: RequestState;
  readonly saveRequest: RequestState;
  readonly supplyEditorRequest: RequestState;
  readonly saveSupplyRequest: RequestState;
  readonly deleteSupplyRequest: RequestState;
  readonly lookupRequestState: RequestState;
}

export const idleRequestState: RequestState = {
  status: 'idle',
  error: null,
};

export const initialPaginationState: PaginationState = {
  page: 1,
  pageSize: 10,
  hasNext: false,
};

export const initialOrderServiceState: OrderServiceState = {
  searchReferenceData: null,
  activeFilter: null,
  orders: [],
  orderPagination: initialPaginationState,
  editor: null,
  lastSaveResult: null,
  supplyEditor: null,
  lookupItems: [],
  lookupPagination: initialPaginationState,
  lookupRequest: null,
  initializeRequest: idleRequestState,
  searchRequest: idleRequestState,
  editorRequest: idleRequestState,
  saveRequest: idleRequestState,
  supplyEditorRequest: idleRequestState,
  saveSupplyRequest: idleRequestState,
  deleteSupplyRequest: idleRequestState,
  lookupRequestState: idleRequestState,
};
