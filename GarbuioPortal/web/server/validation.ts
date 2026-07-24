import {
  LookupType,
  LookupValue,
  OrderStatus,
  OrderType,
  SaveOrderRequest,
  SaveSupplyRequest,
  SupplyType,
  ThirdPartyFlag,
} from './contracts.js';
import { AppError } from './errors.js';

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, field = 'corpo'): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} deve ser um objeto.`);
  }
  return value as UnknownRecord;
}

function text(source: UnknownRecord, field: string, required = false): string {
  const value = source[field];
  if (typeof value !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} deve ser texto.`);
  }
  const normalized = value.trim();
  if (required && !normalized) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} é obrigatório.`);
  }
  return normalized;
}

function numberValue(source: UnknownRecord, field: string): number {
  const value = source[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} deve ser um número não negativo.`);
  }
  return value;
}

function lookup(source: UnknownRecord, field: string): LookupValue {
  const value = record(source[field], field);
  return {
    code: text(value, 'code'),
    description: text(value, 'description'),
  };
}

function orderStatus(value: string): OrderStatus {
  if (value === '' || value === 'P' || value === 'C' || value === 'L') {
    return value;
  }
  throw new AppError(400, 'VALIDATION_ERROR', 'status inválido.');
}

function orderType(value: string): OrderType {
  if (value === '' || value === 'B') {
    return value;
  }
  throw new AppError(400, 'VALIDATION_ERROR', 'type inválido.');
}

function thirdParty(value: string): ThirdPartyFlag {
  if (value === '' || value === '1' || value === '2') {
    return value;
  }
  throw new AppError(400, 'VALIDATION_ERROR', 'thirdParty inválido.');
}

function supplyType(value: string): SupplyType {
  if (
    value === '' ||
    value === 'F' ||
    value === 'M' ||
    value === 'P' ||
    value === 'T' ||
    value === 'E'
  ) {
    return value;
  }
  throw new AppError(400, 'VALIDATION_ERROR', 'type de insumo inválido.');
}

export function parseSaveOrderRequest(input: unknown): SaveOrderRequest {
  const root = record(input);
  const mode = text(root, 'mode');
  if (mode !== 'create' && mode !== 'update') {
    throw new AppError(400, 'VALIDATION_ERROR', 'mode deve ser create ou update.');
  }

  const value = record(root['value'], 'value');
  return {
    mode,
    value: {
      orderServiceId: numberValue(value, 'orderServiceId'),
      order: text(value, 'order'),
      status: orderStatus(text(value, 'status')),
      type: orderType(text(value, 'type', true)),
      branch: text(value, 'branch', true),
      originalDate: text(value, 'originalDate', true),
      originBranch: text(value, 'originBranch'),
      startDate: text(value, 'startDate', true),
      startTime: text(value, 'startTime', true),
      thirdParty: thirdParty(text(value, 'thirdParty')),
      asset: lookup(value, 'asset'),
      service: lookup(value, 'service'),
      costCenter: lookup(value, 'costCenter'),
      inclusionUser: text(value, 'inclusionUser'),
      changeUser: text(value, 'changeUser'),
      notes: text(value, 'notes'),
    },
  };
}

export function parseSaveSupplyRequest(input: unknown): SaveSupplyRequest {
  const root = record(input);
  const mode = text(root, 'mode');
  if (mode !== 'create' && mode !== 'update') {
    throw new AppError(400, 'VALIDATION_ERROR', 'mode deve ser create ou update.');
  }

  const value = record(root['value'], 'value');
  return {
    mode,
    value: {
      orderServiceId: numberValue(value, 'orderServiceId'),
      sequence: numberValue(value, 'sequence'),
      branch: text(value, 'branch', true),
      order: text(value, 'order', true),
      task: lookup(value, 'task'),
      type: supplyType(text(value, 'type', true)),
      supply: lookup(value, 'supply'),
      resourceQuantity: numberValue(value, 'resourceQuantity'),
      quantity: numberValue(value, 'quantity'),
      startDate: text(value, 'startDate'),
      startTime: text(value, 'startTime'),
      warehouse: lookup(value, 'warehouse'),
      location: lookup(value, 'location'),
      supplier: lookup(value, 'supplier'),
      purchaseRequest: text(value, 'purchaseRequest'),
      invoice: text(value, 'invoice'),
      invoiceSeries: text(value, 'invoiceSeries'),
      notes: text(value, 'notes'),
    },
  };
}

const lookupTypes: ReadonlySet<string> = new Set([
  'TJ_ORDEM',
  'TJ_CODBEM',
  'TJ_SERVICO',
  'TJ_CODAREA',
  'TL_TAREFA',
  'TL_CODIGO',
  'TL_LOCAL',
  'TL_LOCALIZ',
  'TL_FORNEC',
]);

export function parseLookupType(value: string): LookupType {
  if (!lookupTypes.has(value)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Tipo de lookup inválido.');
  }
  return value as LookupType;
}

export function requiredRouteValue(value: unknown, name: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || !/^[A-Za-z0-9._/-]+$/.test(normalized)) {
    throw new AppError(400, 'VALIDATION_ERROR', `${name} inválido.`);
  }
  return normalized;
}

export function sequenceValue(value: unknown): number {
  const sequence = Number(value);
  if (!Number.isSafeInteger(sequence) || sequence < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Sequência inválida.');
  }
  return sequence;
}
