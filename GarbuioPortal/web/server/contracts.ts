export type OrderStatus = '' | 'P' | 'C' | 'L';
export type OrderType = '' | 'B';
export type ThirdPartyFlag = '' | '1' | '2';
export type SupplyType = '' | 'F' | 'M' | 'P' | 'T' | 'E';
export type PageSize = 10 | 50 | 100;

export interface PaginatedResult<T> {
  readonly items: ReadonlyArray<T>;
  readonly page: number;
  readonly pageSize: PageSize;
  readonly hasNext: boolean;
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

export interface LookupValue {
  readonly code: string;
  readonly description: string;
}

export interface OrderFilter {
  readonly startDate: string;
  readonly endDate: string;
  readonly branch: string;
  readonly status: OrderStatus;
  readonly order: string;
  readonly plate: string;
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
}

export interface SaveOrderRequest {
  readonly mode: 'create' | 'update';
  readonly value: OrderEditorValue;
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

export interface SaveSupplyRequest {
  readonly mode: 'create' | 'update';
  readonly value: SupplyEditorValue;
}

export interface LookupRequest {
  readonly type: LookupType;
  readonly filter: string;
  readonly query: string;
}

export type ProtheusRecord = Record<string, unknown>;

export interface CorrectiveSupplyPayload {
  readonly item: string;
  readonly tarefa: string;
  readonly tipo: string;
  readonly codigo: string;
  readonly qtd_rec: number;
  readonly qtd_usada: number;
  readonly dt_inicio: string;
  readonly hr_inicio: string;
  readonly local: string;
  readonly localiza: string;
  readonly nfe: string;
  readonly serie: string;
  readonly obs: string;
}

export interface CorrectiveOrderPayload {
  readonly id: string;
  readonly filial: string;
  readonly filial_origem: string;
  readonly dt_original: string;
  readonly bem: string;
  readonly servico: string;
  readonly dt_inicio: string;
  readonly hr_inicio: string;
  readonly situacao: string;
  readonly obs: string;
  readonly terceiro: string;
  readonly usuario: string;
  readonly cc: string;
  readonly dados: {
    readonly insumos: ReadonlyArray<CorrectiveSupplyPayload>;
    readonly etapas: ReadonlyArray<never>;
    readonly sintomas: ReadonlyArray<never>;
  };
}
