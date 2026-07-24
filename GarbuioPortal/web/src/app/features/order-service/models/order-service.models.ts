export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RequestState {
  readonly status: RequestStatus;
  readonly error: import('../../../core/errors/api-error').ApiError | null;
}

export interface SelectOption {
  readonly label: string;
  readonly value: string;
}

export interface LookupValue {
  readonly code: string;
  readonly description: string;
}

export type OrderStatus = '' | 'P' | 'C' | 'L';
export type OrderType = '' | 'B';
export type ThirdPartyFlag = '' | '1' | '2';
export type SupplyType = '' | 'F' | 'M' | 'P' | 'T' | 'E';
export type PageSize = 10 | 50 | 100;

export interface PaginationState {
  readonly page: number;
  readonly pageSize: PageSize;
  readonly hasNext: boolean;
}

export interface PaginatedResult<T> extends PaginationState {
  readonly items: ReadonlyArray<T>;
}

export interface OrderFilter {
  readonly startDate: string;
  readonly endDate: string;
  readonly branch: string;
  readonly status: OrderStatus;
  readonly order: string;
  readonly plate: string;
}

export interface OrderSearchRequest {
  readonly filter: OrderFilter;
  readonly page: number;
  readonly pageSize: PageSize;
}

export interface OrderSearchReferenceData {
  readonly initialFilter: OrderFilter;
  readonly branches: ReadonlyArray<SelectOption>;
  readonly statuses: ReadonlyArray<SelectOption>;
}

export interface OrderListItem {
  readonly id: string;
  readonly branch: string;
  readonly order: string;
  readonly plate: string;
  readonly status: OrderStatus;
  readonly statusLabel: string;
  readonly type: string;
  readonly originalDate: string;
  readonly assetDescription: string;
  readonly serviceDescription: string;
  readonly editable: boolean;
}

export interface SupplyListItem {
  readonly id: string;
  readonly orderServiceId: number;
  readonly sequence: number;
  readonly branch: string;
  readonly type: SupplyType;
  readonly typeLabel: string;
  readonly taskDescription: string;
  readonly supplyDescription: string;
  readonly quantity: number;
}

export interface OrderEditorValue {
  readonly orderServiceId: number;
  readonly order: string;
  readonly status: OrderStatus;
  readonly type: OrderType;
  readonly branch: string;
  readonly originalDate: string;
  readonly originBranch: string;
  readonly startDate: string;
  readonly startTime: string;
  readonly thirdParty: ThirdPartyFlag;
  readonly asset: LookupValue;
  readonly service: LookupValue;
  readonly costCenter: LookupValue;
  readonly inclusionUser: string;
  readonly changeUser: string;
  readonly notes: string;
  readonly supplies: ReadonlyArray<SupplyListItem>;
}

export interface OrderEditorReferenceData {
  readonly branches: ReadonlyArray<SelectOption>;
  readonly originBranches: ReadonlyArray<SelectOption>;
  readonly statuses: ReadonlyArray<SelectOption>;
  readonly types: ReadonlyArray<SelectOption>;
  readonly thirdPartyOptions: ReadonlyArray<SelectOption>;
}

export interface OrderEditorData {
  readonly mode: 'create' | 'update';
  readonly value: OrderEditorValue;
  readonly referenceData: OrderEditorReferenceData;
}

export interface SaveOrderRequest {
  readonly mode: 'create' | 'update';
  readonly value: Omit<OrderEditorValue, 'supplies'>;
}

export interface SaveOrderResult {
  readonly orderServiceId: number;
  readonly order: string;
  readonly branch: string;
}

export interface SupplyEditorValue {
  readonly orderServiceId: number;
  readonly sequence: number;
  readonly branch: string;
  readonly order: string;
  readonly task: LookupValue;
  readonly type: SupplyType;
  readonly supply: LookupValue;
  readonly resourceQuantity: number;
  readonly quantity: number;
  readonly startDate: string;
  readonly startTime: string;
  readonly warehouse: LookupValue;
  readonly location: LookupValue;
  readonly supplier: LookupValue;
  readonly purchaseRequest: string;
  readonly invoice: string;
  readonly invoiceSeries: string;
  readonly notes: string;
}

export interface SupplyEditorData {
  readonly mode: 'create' | 'update';
  readonly value: SupplyEditorValue;
  readonly types: ReadonlyArray<SelectOption>;
}

export interface SaveSupplyRequest {
  readonly mode: 'create' | 'update';
  readonly value: SupplyEditorValue;
}

export interface SaveSupplyResult {
  readonly orderServiceId: number;
  readonly order: string;
  readonly sequence: number;
}

export type LookupType =
  | 'TJ_ORDEM'
  | 'TJ_CODBEM'
  | 'TJ_SERVICO'
  | 'TJ_CODAREA'
  | 'TL_TAREFA'
  | 'TL_CODIGO'
  | 'TL_LOCAL'
  | 'TL_LOCALIZ'
  | 'TL_FORNEC';

export interface LookupRequest {
  readonly type: LookupType;
  readonly filter: string;
  readonly query: string;
  readonly page: number;
  readonly pageSize: PageSize;
}

export interface LookupItem {
  readonly code: string;
  readonly description: string;
}

export interface DeleteSupplyRequest {
  readonly orderServiceId: number;
  readonly sequence: number;
  readonly branch: string;
  readonly order: string;
}
