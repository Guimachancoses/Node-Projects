import { ServerConfig } from './config.js';
import {
  CorrectiveOrderPayload,
  CorrectiveSupplyPayload,
  LookupRequest,
  LookupType,
  OrderEditorValue,
  OrderFilter,
  OrderStatus,
  PageSize,
  PaginatedResult,
  ProtheusRecord,
  SaveOrderRequest,
  SaveSupplyRequest,
  SupplyEditorValue,
  SupplyType,
} from './contracts.js';
import { AppError } from './errors.js';
import { ProtheusClient } from './protheus-client.js';

const statusOptions = [
  { label: 'Pendente', value: 'P' },
  { label: 'Cancelada', value: 'C' },
  { label: 'Liberada', value: 'L' },
] as const;

const searchStatusOptions = [{ label: 'Todas', value: '' }, ...statusOptions] as const;

const typeOptions = [{ label: 'Bem', value: 'B' }] as const;

const thirdPartyOptions = [
  { label: 'Não', value: '1' },
  { label: 'Sim', value: '2' },
] as const;

const supplyTypeOptions = [
  { label: 'Ferramenta', value: 'F' },
  { label: 'Mão de obra', value: 'M' },
  { label: 'Produto', value: 'P' },
  { label: 'Terceiro', value: 'T' },
  { label: 'Especialidade', value: 'E' },
] as const;

const orderFields = [
  'TJ_FILIAL',
  'TJ_ORDEM',
  'TJ_DTORIGI',
  'TJ_TIPOOS',
  'TJ_CODBEM',
  'TJ_NOMBEM',
  'TJ_SERVICO',
  'TJ_NOMSERV',
  'TJ_TIPO',
  'TJ_CODAREA',
  'TJ_CCUSTO',
  'TJ_NOMAREA',
  'TJ_DTPRINI',
  'TJ_HOPRINI',
  'TJ_SITUACA',
  'TJ_TERMINO',
  'TJ_TERCEIR',
  'TJ_OBSERVA',
  'TJ_XINTEGR',
  'TJ_XORIG',
  'TJ_USUAINI',
  'TJ_USUARIO',
].join(',');

const supplyFields = [
  'TL_FILIAL',
  'TL_ORDEM',
  'TL_SEQRELA',
  'TL_TAREFA',
  'TL_NOMTAR',
  'TL_TIPOREG',
  'TL_CODIGO',
  'TL_NOMCODI',
  'TL_QUANREC',
  'TL_QUANTID',
  'TL_DTINICI',
  'TL_HOINICI',
  'TL_LOCAL',
  'TL_LOCALIZ',
  'TL_OBSERVA',
  'TL_NUMSC',
  'TL_NOTFIS',
  'TL_SERIE',
  'TL_FORNEC',
  'TL_LOJA',
  'TL_NUMSEQ',
  'TL_SEQUENC',
  'TL_XITEM',
].join(',');

interface LookupDefinition {
  readonly table: string;
  readonly fields: string;
  readonly codeField: string;
  readonly descriptionField: string;
  readonly baseWhere: string;
  readonly searchFields: ReadonlyArray<string>;
}

export interface BranchOption {
  readonly label: string;
  readonly value: string;
}

interface OrderListResult {
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

function recordValue(record: ProtheusRecord, ...names: ReadonlyArray<string>): unknown {
  for (const name of names) {
    const exact = record[name];
    if (exact !== undefined && exact !== null) {
      return exact;
    }
    const normalized = name.toLocaleLowerCase('en-US');
    const entry = Object.entries(record).find(
      ([key]) => key.toLocaleLowerCase('en-US') === normalized,
    );
    if (entry && entry[1] !== null) {
      return entry[1];
    }
  }
  return '';
}

function stringValue(record: ProtheusRecord, ...names: ReadonlyArray<string>): string {
  const value = recordValue(record, ...names);
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
}

function numberValue(record: ProtheusRecord, ...names: ReadonlyArray<string>): number {
  const value = recordValue(record, ...names);
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return 0;
  }

  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function protheusDate(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 8
    ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    : '';
}

function apiDate(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

function sqlLiteral(value: string): string {
  return value.trim().slice(0, 100).replace(/'/g, "''");
}

function sharedBranch(value: string): string {
  return value.trim().slice(0, 2);
}

function status(value: string): OrderStatus {
  return value === 'P' || value === 'C' || value === 'L' ? value : '';
}

function supplyType(value: string): SupplyType {
  return value === 'F' || value === 'M' || value === 'P' || value === 'T' || value === 'E'
    ? value
    : '';
}

function statusLabel(value: OrderStatus): string {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}

function supplyTypeLabel(value: SupplyType): string {
  return supplyTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function uniqueValues(values: ReadonlyArray<string>): ReadonlyArray<string> {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function descriptionMap(
  records: ReadonlyArray<ProtheusRecord>,
  codeField: string,
  descriptionField: string,
): ReadonlyMap<string, string> {
  const descriptions = new Map<string, string>();
  for (const record of records) {
    const code = stringValue(record, codeField);
    const description = stringValue(record, descriptionField);
    if (code && description && !descriptions.has(code)) {
      descriptions.set(code, description);
    }
  }
  return descriptions;
}

function establishmentBranchCode(record: ProtheusRecord): string {
  return stringValue(record, 'COD_ESTAB_ERP').split('.').at(-1)?.trim() ?? '';
}

function establishmentLabel(record: ProtheusRecord): string {
  const description = stringValue(record, 'DES_ESTAB');
  const location = description.split(' - ').at(-1)?.trim() ?? '';
  return location
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s./-])([a-zà-ÿ])/g, (value) => value.toLocaleUpperCase('pt-BR'));
}

const knownOriginBranchLabels: Readonly<Record<string, string>> = Object.freeze({
  BAR: 'Barueri',
  BAU: 'Bauru',
  EXT: 'Serviço Externo',
  LIM: 'Limeira',
  LPA: 'Lençóis Paulista',
  PPR: 'Presidente Prudente',
  RON: 'Rondonópolis',
  RPR: 'Ribeirão Preto',
  SPO: 'São Paulo',
});

function comparableText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleUpperCase('pt-BR')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function originCodeCandidates(label: string): ReadonlySet<string> {
  const ignoredWords = new Set(['DA', 'DAS', 'DE', 'DO', 'DOS']);
  const words = comparableText(label)
    .split(' ')
    .filter((word) => word && !ignoredWords.has(word));
  const candidates = new Set<string>();

  for (const word of words) {
    candidates.add(word.slice(0, 3));
  }

  if (words.length > 1) {
    const first = words[0] ?? '';
    const last = words.at(-1) ?? '';
    candidates.add(words.map((word) => word[0]).join(''));
    candidates.add(`${first[0] ?? ''}${last.slice(0, 2)}`);
    candidates.add(`${first[0] ?? ''}${last[0] ?? ''}${last.at(-1) ?? ''}`);
  }

  const digits = words.flatMap((word) => word.match(/\d+/g) ?? []).join('');
  if (digits && words[0]) {
    candidates.add(`${words[0][0]}${digits}`);
  }

  return candidates;
}

function originBranchLabel(code: string, branches: ReadonlyArray<BranchOption>): string {
  const normalizedCode = comparableText(code).replace(/\s/g, '');
  const knownLabel = knownOriginBranchLabels[normalizedCode];
  if (knownLabel) {
    return knownLabel;
  }

  return (
    branches.find((branch) => originCodeCandidates(branch.label).has(normalizedCode))?.label ?? code
  );
}

function firstAndLastDayOfMonth(baseDate = localDate()): readonly [string, string] {
  const [yearText = '', monthText = ''] = baseDate.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const reference =
    Number.isSafeInteger(year) && Number.isSafeInteger(month) && month >= 1 && month <= 12
      ? new Date(year, month - 1, 1)
      : new Date();
  const firstDay = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const lastDay = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return [localDate(firstDay), localDate(lastDay)];
}

function localDate(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class OrderService {
  constructor(
    private readonly client: ProtheusClient,
    private readonly config: ServerConfig,
  ) {}

  async referenceData(defaultBranch = '', baseDate = localDate()): Promise<object> {
    const [startDate, endDate] = firstAndLastDayOfMonth(baseDate);
    const branches = await this.branchOptions();
    return {
      initialFilter: {
        startDate,
        endDate,
        branch: defaultBranch,
        status: '' as OrderStatus,
        order: '',
        plate: '',
      },
      branches,
      statuses: searchStatusOptions,
    };
  }

  async searchOrders(
    filter: OrderFilter,
    page: number,
    pageSize: PageSize,
  ): Promise<PaginatedResult<OrderListResult>> {
    const startDate = apiDate(filter.startDate);
    const endDate = apiDate(filter.endDate);
    const optionalOrder = filter.order ? ` AND TJ_ORDEM = '${sqlLiteral(filter.order)}'` : '';
    const optionalStatus = filter.status ? ` AND TJ_SITUACA = '${sqlLiteral(filter.status)}'` : '';
    const optionalPlate = filter.plate ? ` AND TJ_CODBEM = '${sqlLiteral(filter.plate)}'` : '';
    const result = await this.client.genericQueryPage(
      {
        table: 'STJ',
        fields: orderFields,
        where:
          `D_E_L_E_T_ = ' ' AND TJ_FILIAL = '${sqlLiteral(filter.branch)}' ` +
          `AND TJ_DTORIGI BETWEEN '${startDate}' AND '${endDate}' ` +
          `AND TJ_PLANO = '000000' AND TJ_ORDEPAI = '      '` +
          optionalOrder +
          optionalStatus +
          optionalPlate,
      },
      page,
      pageSize,
    );

    const assetCodes = uniqueValues(result.items.map((record) => stringValue(record, 'TJ_CODBEM')));
    const serviceCodes = uniqueValues(
      result.items.map((record) => stringValue(record, 'TJ_SERVICO')),
    );
    const [assetDescriptions, serviceDescriptions] = await Promise.all([
      this.loadDescriptions('ST9', 'T9_CODBEM', 'T9_NOME', assetCodes),
      this.loadDescriptions('ST4', 'T4_SERVICO', 'T4_NOME', serviceCodes),
    ]);

    const items = result.items.map((record): OrderListResult => {
      const branch = stringValue(record, 'TJ_FILIAL');
      const order = stringValue(record, 'TJ_ORDEM');
      const currentStatus = status(stringValue(record, 'TJ_SITUACA'));
      const finished = stringValue(record, 'TJ_TERMINO') === 'S';
      const assetCode = stringValue(record, 'TJ_CODBEM');
      const serviceCode = stringValue(record, 'TJ_SERVICO');
      return {
        id: stringValue(record, 'TJ_XINTEGR') || `${branch}-${order}`,
        branch,
        order,
        plate: assetCode,
        status: currentStatus,
        statusLabel: statusLabel(currentStatus),
        type: stringValue(record, 'TJ_TIPOOS', 'TJ_TIPO'),
        originalDate: protheusDate(stringValue(record, 'TJ_DTORIGI')),
        assetDescription:
          stringValue(record, 'TJ_NOMBEM') || assetDescriptions.get(assetCode) || assetCode,
        serviceDescription:
          stringValue(record, 'TJ_NOMSERV') || serviceDescriptions.get(serviceCode) || serviceCode,
        editable: !finished && (currentStatus === 'P' || currentStatus === 'L'),
      };
    });

    return {
      items,
      page,
      pageSize,
      hasNext: result.hasNext,
    };
  }

  async newOrder(
    baseDate = localDate(),
    defaultBranch = '',
    inclusionUser = this.config.defaultUserCode,
  ): Promise<object> {
    const today = baseDate;
    return {
      mode: 'create',
      value: {
        orderServiceId: 0,
        order: '',
        status: 'P',
        type: 'B',
        branch: defaultBranch,
        originalDate: today,
        originBranch: '',
        startDate: today,
        startTime: '00:00',
        thirdParty: '1',
        asset: { code: '', description: '' },
        service: { code: '', description: '' },
        costCenter: { code: '', description: '' },
        inclusionUser,
        changeUser: '',
        notes: '',
        supplies: [],
      },
      referenceData: await this.editorReferenceData(),
    };
  }

  async orderEditor(branch: string, order: string): Promise<object> {
    const [record, supplyRecords] = await Promise.all([
      this.readOrderRecord(branch, order),
      this.readSupplyRecords(branch, order),
    ]);
    const mappedOrderValue = this.mapOrderValue(record);
    const [orderValue, referenceData, supplyValues] = await Promise.all([
      this.enrichOrderValue(mappedOrderValue),
      this.editorReferenceData(mappedOrderValue.originBranch),
      this.enrichSupplyValues(supplyRecords, mappedOrderValue.orderServiceId, branch, order),
    ]);

    return {
      mode: 'update',
      value: {
        ...orderValue,
        supplies: supplyValues.map((supply) => this.mapSupplyListItem(supply)),
      },
      referenceData,
    };
  }

  async saveOrder(request: SaveOrderRequest): Promise<object> {
    const supplies =
      request.mode === 'update' && request.value.order
        ? await this.readSupplyRecords(request.value.branch, request.value.order)
        : [];
    const payload = this.orderPayload(
      request.value,
      supplies.map((supply) => this.correctiveSupply(supply)),
    );
    const response =
      request.mode === 'create'
        ? await this.client.saveCorrectiveOrder(payload)
        : await this.client.saveCorrectiveOrder(payload, request.value.branch, request.value.order);
    const savedOrder = this.assertSaveResponse(response, request.value.order);
    const savedRecord = await this.readOrderRecord(request.value.branch, savedOrder);

    return {
      orderServiceId: numberValue(savedRecord, 'TJ_XINTEGR'),
      order: savedOrder,
      branch: request.value.branch,
    };
  }

  async supplyEditor(
    branch: string,
    order: string,
    orderServiceId: number,
    sequence?: number,
  ): Promise<object> {
    if (sequence === undefined) {
      const records = await this.readSupplyRecords(branch, order);
      return {
        mode: 'create',
        value: this.newSupplyValue(branch, order, orderServiceId, this.nextSupplySequence(records)),
        types: supplyTypeOptions,
      };
    }

    const records = await this.readSupplyRecords(branch, order);
    const record = records.find((item) => this.supplySequence(item) === sequence);
    if (!record) {
      throw new AppError(404, 'NOT_FOUND', 'Insumo não encontrado no Protheus.');
    }

    const [value] = await this.enrichSupplyValues([record], orderServiceId, branch, order);
    if (!value) {
      throw new AppError(404, 'NOT_FOUND', 'Insumo não encontrado no Protheus.');
    }

    return {
      mode: 'update',
      value,
      types: supplyTypeOptions,
    };
  }

  async saveSupply(request: SaveSupplyRequest): Promise<object> {
    const { branch, order, orderServiceId } = request.value;
    const [orderRecord, supplyRecords] = await Promise.all([
      this.readOrderRecord(branch, order),
      this.readSupplyRecords(branch, order),
    ]);
    const currentSupplies = supplyRecords.map((record) => this.correctiveSupply(record));
    const nextSequence =
      request.mode === 'create' ? this.nextSupplySequence(supplyRecords) : request.value.sequence;
    const changedSupply = this.correctiveSupplyFromValue(request.value, nextSequence);

    const index = currentSupplies.findIndex(
      (supply) => Number(supply.item) === request.value.sequence,
    );
    if (request.mode === 'update') {
      if (index < 0) {
        throw new AppError(404, 'NOT_FOUND', 'Insumo não encontrado para alteração.');
      }
      currentSupplies[index] = changedSupply;
    } else {
      currentSupplies.push(changedSupply);
    }

    await this.client.saveCorrectiveOrder(
      this.orderPayload(this.mapOrderValue(orderRecord), currentSupplies),
      branch,
      order,
    );

    return { orderServiceId, order, sequence: nextSequence };
  }

  async deleteSupply(
    branch: string,
    order: string,
    orderServiceId: number,
    sequence: number,
  ): Promise<void> {
    const [orderRecord, supplyRecords] = await Promise.all([
      this.readOrderRecord(branch, order),
      this.readSupplyRecords(branch, order),
    ]);
    const remaining = supplyRecords.filter((record) => this.supplySequence(record) !== sequence);
    if (remaining.length === supplyRecords.length) {
      throw new AppError(404, 'NOT_FOUND', 'Insumo não encontrado para exclusão.');
    }

    const value = this.mapOrderValue(orderRecord);
    await this.client.saveCorrectiveOrder(
      this.orderPayload(
        { ...value, orderServiceId: orderServiceId || value.orderServiceId },
        remaining.map((record) => this.correctiveSupply(record)),
      ),
      branch,
      order,
    );
  }

  async lookup(
    request: LookupRequest,
    page: number,
    pageSize: PageSize,
  ): Promise<PaginatedResult<object>> {
    const definition = this.lookupDefinition(request.type, request.filter);
    if (!definition) {
      return { items: [], page, pageSize, hasNext: false };
    }

    const query = sqlLiteral(request.query);
    const searchWhere = query
      ? ` AND (${definition.searchFields
          .map((field) => `${field} LIKE '%${query}%'`)
          .join(' OR ')})`
      : '';
    const result = await this.client.genericQueryPage(
      {
        table: definition.table,
        fields: definition.fields,
        where: `${definition.baseWhere}${searchWhere}`,
      },
      page,
      pageSize,
    );

    const orderAssetDescriptions =
      request.type === 'TJ_ORDEM'
        ? await this.loadDescriptions(
            'ST9',
            'T9_CODBEM',
            'T9_NOME',
            result.items.map((record) => stringValue(record, 'TJ_CODBEM')),
          )
        : new Map<string, string>();
    const unique = new Map<string, object>();
    for (const record of result.items) {
      const code = stringValue(record, definition.codeField);
      if (code && !unique.has(code)) {
        const assetCode = stringValue(record, 'TJ_CODBEM');
        const description =
          request.type === 'TJ_ORDEM'
            ? [assetCode, stringValue(record, 'TJ_NOMBEM') || orderAssetDescriptions.get(assetCode)]
                .filter(Boolean)
                .join(' - ')
            : stringValue(record, definition.descriptionField);
        unique.set(code, {
          code,
          description,
        });
      }
    }
    return {
      items: [...unique.values()],
      page,
      pageSize,
      hasNext: result.hasNext,
    };
  }

  async contextOptions(): Promise<ReadonlyArray<BranchOption>> {
    return this.branchOptions();
  }

  private async readOrderRecord(branch: string, order: string): Promise<ProtheusRecord> {
    const records = await this.client.genericQuery({
      table: 'STJ',
      fields: orderFields,
      where:
        `D_E_L_E_T_ = ' ' AND TJ_FILIAL = '${sqlLiteral(branch)}' ` +
        `AND TJ_ORDEM = '${sqlLiteral(order)}' AND TJ_PLANO = '000000' ` +
        `AND TJ_TERMINO = 'N' AND TJ_ORDEPAI = '      ' ` +
        `AND (TJ_SITUACA = 'L' OR TJ_SITUACA = 'P')`,
    });
    const record = records[0];
    if (!record) {
      throw new AppError(404, 'NOT_FOUND', 'Ordem de serviço não encontrada no Protheus.');
    }
    return record;
  }

  private readSupplyRecords(branch: string, order: string): Promise<ReadonlyArray<ProtheusRecord>> {
    return this.client.genericQuery({
      table: 'STL',
      fields: supplyFields,
      where:
        `D_E_L_E_T_ = ' ' AND TL_FILIAL = '${sqlLiteral(branch)}' ` +
        `AND TL_ORDEM = '${sqlLiteral(order)}'`,
    });
  }

  private mapOrderValue(record: ProtheusRecord): OrderEditorValue {
    return {
      orderServiceId: numberValue(record, 'TJ_XINTEGR'),
      order: stringValue(record, 'TJ_ORDEM'),
      status: status(stringValue(record, 'TJ_SITUACA')),
      type: stringValue(record, 'TJ_TIPOOS', 'TJ_TIPO') === 'B' ? 'B' : '',
      branch: stringValue(record, 'TJ_FILIAL'),
      originalDate: protheusDate(stringValue(record, 'TJ_DTORIGI')),
      originBranch: stringValue(record, 'TJ_XORIG'),
      startDate: protheusDate(stringValue(record, 'TJ_DTPRINI')),
      startTime: stringValue(record, 'TJ_HOPRINI'),
      thirdParty:
        stringValue(record, 'TJ_TERCEIR') === '1' || stringValue(record, 'TJ_TERCEIR') === '2'
          ? (stringValue(record, 'TJ_TERCEIR') as '1' | '2')
          : '',
      asset: {
        code: stringValue(record, 'TJ_CODBEM'),
        description: stringValue(record, 'TJ_NOMBEM'),
      },
      service: {
        code: stringValue(record, 'TJ_SERVICO'),
        description: stringValue(record, 'TJ_NOMSERV'),
      },
      costCenter: {
        code: stringValue(record, 'TJ_CCUSTO', 'TJ_CODAREA'),
        description: stringValue(record, 'TJ_NOMAREA'),
      },
      inclusionUser: stringValue(record, 'TJ_USUAINI'),
      changeUser: stringValue(record, 'TJ_USUARIO'),
      notes: stringValue(record, 'TJ_OBSERVA'),
    };
  }

  private async enrichOrderValue(value: OrderEditorValue): Promise<OrderEditorValue> {
    const assetRequest: Promise<ReadonlyArray<ProtheusRecord>> = value.asset.code
      ? this.client.genericQuery({
          table: 'ST9',
          fields: 'T9_CODBEM,T9_NOME,T9_PLACA,T9_ZZPLACA',
          where: `D_E_L_E_T_ = ' ' AND T9_CODBEM = '${sqlLiteral(value.asset.code)}'`,
        })
      : Promise.resolve([]);
    const [assetRecords, serviceDescriptions, costCenterDescriptions] = await Promise.all([
      assetRequest,
      this.loadDescriptions('ST4', 'T4_SERVICO', 'T4_NOME', [value.service.code]),
      this.loadDescriptions('CTT', 'CTT_CUSTO', 'CTT_DESC01', [value.costCenter.code]),
    ]);

    const assetRecord = assetRecords[0];
    const plate =
      (assetRecord && stringValue(assetRecord, 'T9_PLACA', 'T9_ZZPLACA')) || value.asset.code;
    const assetName =
      (assetRecord && stringValue(assetRecord, 'T9_NOME')) || value.asset.description;
    const assetDescription =
      uniqueValues([plate, assetName]).join(' - ') || value.asset.description || value.asset.code;

    return {
      ...value,
      asset: { code: value.asset.code, description: assetDescription },
      service: {
        code: value.service.code,
        description:
          serviceDescriptions.get(value.service.code) ||
          value.service.description ||
          value.service.code,
      },
      costCenter: {
        code: value.costCenter.code,
        description:
          costCenterDescriptions.get(value.costCenter.code) ||
          value.costCenter.description ||
          value.costCenter.code,
      },
    };
  }

  private mapSupplyListItem(value: SupplyEditorValue): object {
    return {
      id: `${value.orderServiceId}-${value.sequence}`,
      orderServiceId: value.orderServiceId,
      sequence: value.sequence,
      branch: value.branch,
      type: value.type,
      typeLabel: supplyTypeLabel(value.type),
      taskDescription: value.task.description || value.task.code,
      supplyDescription: value.supply.description || value.supply.code,
      quantity: value.quantity,
    };
  }

  private mapSupplyValue(
    record: ProtheusRecord,
    orderServiceId: number,
    branch: string,
    order: string,
  ): SupplyEditorValue {
    return {
      orderServiceId,
      sequence: this.supplySequence(record),
      branch,
      order,
      task: {
        code: stringValue(record, 'TL_TAREFA'),
        description: stringValue(record, 'TL_NOMTAR'),
      },
      type: supplyType(stringValue(record, 'TL_TIPOREG')),
      supply: {
        code: stringValue(record, 'TL_CODIGO'),
        description: stringValue(record, 'TL_NOMCODI'),
      },
      resourceQuantity: numberValue(record, 'TL_QUANREC'),
      quantity: numberValue(record, 'TL_QUANTID'),
      startDate: protheusDate(stringValue(record, 'TL_DTINICI')),
      startTime: stringValue(record, 'TL_HOINICI'),
      warehouse: { code: stringValue(record, 'TL_LOCAL'), description: '' },
      location: { code: stringValue(record, 'TL_LOCALIZ'), description: '' },
      supplier: { code: stringValue(record, 'TL_FORNEC'), description: '' },
      purchaseRequest: stringValue(record, 'TL_NUMSC'),
      invoice: stringValue(record, 'TL_NOTFIS'),
      invoiceSeries: stringValue(record, 'TL_SERIE'),
      notes: stringValue(record, 'TL_OBSERVA'),
    };
  }

  private async enrichSupplyValues(
    records: ReadonlyArray<ProtheusRecord>,
    orderServiceId: number,
    branch: string,
    order: string,
  ): Promise<ReadonlyArray<SupplyEditorValue>> {
    if (records.length === 0) {
      return [];
    }

    const values = records.map((record) =>
      this.mapSupplyValue(record, orderServiceId, branch, order),
    );
    const taskDefinition = this.lookupDefinition('TL_TAREFA', branch);
    const warehouseDefinition = this.lookupDefinition('TL_LOCAL', branch);
    const supplierDefinition = this.lookupDefinition('TL_FORNEC', branch);
    const [taskDescriptions, warehouseDescriptions, supplierDescriptions] = await Promise.all([
      this.loadLookupDescriptions(
        taskDefinition,
        values.map((value) => value.task.code),
      ),
      this.loadLookupDescriptions(
        warehouseDefinition,
        values.map((value) => value.warehouse.code),
      ),
      this.loadLookupDescriptions(
        supplierDefinition,
        values.map((value) => value.supplier.code),
      ),
    ]);

    const supplyDescriptions = new Map<string, string>();
    const supplyTypes: ReadonlyArray<SupplyType> = ['M', 'P', 'T', 'E'];
    await Promise.all(
      supplyTypes.map(async (type) => {
        const definition = this.supplyCodeLookup(branch, type);
        const descriptions = await this.loadLookupDescriptions(
          definition,
          values.filter((value) => value.type === type).map((value) => value.supply.code),
        );
        for (const [code, description] of descriptions) {
          supplyDescriptions.set(`${type};${code}`, description);
        }
      }),
    );

    const locationDescriptions = new Map<string, string>();
    const locationsByWarehouse = new Map<string, Array<string>>();
    for (const value of values) {
      if (!value.warehouse.code || !value.location.code) {
        continue;
      }
      const locations = locationsByWarehouse.get(value.warehouse.code) ?? [];
      locations.push(value.location.code);
      locationsByWarehouse.set(value.warehouse.code, locations);
    }
    await Promise.all(
      [...locationsByWarehouse].map(async ([warehouse, locationCodes]) => {
        const definition = this.lookupDefinition('TL_LOCALIZ', `${branch};${warehouse}`);
        const descriptions = await this.loadLookupDescriptions(definition, locationCodes);
        for (const [code, description] of descriptions) {
          locationDescriptions.set(`${warehouse};${code}`, description);
        }
      }),
    );

    return values.map((value): SupplyEditorValue => ({
      ...value,
      task: {
        code: value.task.code,
        description:
          value.task.description || taskDescriptions.get(value.task.code) || value.task.code,
      },
      supply: {
        code: value.supply.code,
        description:
          value.supply.description ||
          supplyDescriptions.get(`${value.type};${value.supply.code}`) ||
          value.supply.code,
      },
      warehouse: {
        code: value.warehouse.code,
        description:
          value.warehouse.description ||
          warehouseDescriptions.get(value.warehouse.code) ||
          value.warehouse.code,
      },
      location: {
        code: value.location.code,
        description:
          value.location.description ||
          locationDescriptions.get(`${value.warehouse.code};${value.location.code}`) ||
          value.location.code,
      },
      supplier: {
        code: value.supplier.code,
        description:
          value.supplier.description ||
          supplierDescriptions.get(value.supplier.code) ||
          value.supplier.code,
      },
    }));
  }

  private nextSupplySequence(records: ReadonlyArray<ProtheusRecord>): number {
    return Math.max(0, ...records.map((record) => this.supplySequence(record))) + 1;
  }

  private newSupplyValue(
    branch: string,
    order: string,
    orderServiceId: number,
    sequence: number,
  ): SupplyEditorValue {
    return {
      orderServiceId,
      sequence,
      branch,
      order,
      task: { code: '', description: '' },
      type: 'F',
      supply: { code: '', description: '' },
      resourceQuantity: 0,
      quantity: 0,
      startDate: localDate(),
      startTime: '00:00',
      warehouse: { code: '', description: '' },
      location: { code: '', description: '' },
      supplier: { code: '', description: '' },
      purchaseRequest: '',
      invoice: '',
      invoiceSeries: '',
      notes: '',
    };
  }

  private orderPayload(
    value: OrderEditorValue,
    supplies: ReadonlyArray<CorrectiveSupplyPayload>,
  ): CorrectiveOrderPayload {
    return {
      id: String(value.orderServiceId),
      filial: value.branch,
      filial_origem: value.originBranch,
      dt_original: apiDate(value.originalDate),
      bem: value.asset.code,
      servico: value.service.code,
      dt_inicio: apiDate(value.startDate),
      hr_inicio: value.startTime,
      situacao: value.status,
      obs: value.notes,
      terceiro: value.thirdParty,
      usuario: value.changeUser || value.inclusionUser || this.config.defaultUserCode,
      cc: value.costCenter.code,
      dados: {
        insumos: supplies,
        etapas: [],
        sintomas: [],
      },
    };
  }

  private correctiveSupply(record: ProtheusRecord): CorrectiveSupplyPayload {
    return {
      item: String(this.supplySequence(record)),
      tarefa: stringValue(record, 'TL_TAREFA'),
      tipo: stringValue(record, 'TL_TIPOREG'),
      codigo: stringValue(record, 'TL_CODIGO'),
      qtd_rec: numberValue(record, 'TL_QUANREC'),
      qtd_usada: numberValue(record, 'TL_QUANTID'),
      dt_inicio: apiDate(stringValue(record, 'TL_DTINICI')),
      hr_inicio: stringValue(record, 'TL_HOINICI'),
      local: stringValue(record, 'TL_LOCAL'),
      localiza: stringValue(record, 'TL_LOCALIZ'),
      nfe: stringValue(record, 'TL_NOTFIS'),
      serie: stringValue(record, 'TL_SERIE'),
      obs: stringValue(record, 'TL_OBSERVA'),
    };
  }

  private correctiveSupplyFromValue(
    value: SupplyEditorValue,
    sequence: number,
  ): CorrectiveSupplyPayload {
    return {
      item: String(sequence),
      tarefa: value.task.code,
      tipo: value.type,
      codigo: value.supply.code,
      qtd_rec: value.resourceQuantity,
      qtd_usada: value.quantity,
      dt_inicio: apiDate(value.startDate),
      hr_inicio: value.startTime,
      local: value.warehouse.code,
      localiza: value.location.code,
      nfe: value.invoice,
      serie: value.invoiceSeries,
      obs: value.notes,
    };
  }

  private supplySequence(record: ProtheusRecord): number {
    return numberValue(record, 'TL_XITEM', 'TL_ITEM', 'TL_SEQRELA', 'TL_SEQUENC', 'TL_NUMSEQ');
  }

  private assertSaveResponse(response: ProtheusRecord, fallbackOrder: string): string {
    const successValue = recordValue(response, 'retorno', 'success', 'sucesso');
    const succeeded =
      successValue === undefined ||
      successValue === '' ||
      successValue === true ||
      successValue === 1 ||
      successValue === '1' ||
      String(successValue).toLocaleLowerCase('pt-BR') === 'true';

    if (!succeeded) {
      const reason = stringValue(response, 'faultstring', 'message', 'motivo');
      throw new AppError(
        422,
        'UPSTREAM_ERROR',
        reason || 'O Protheus rejeitou a gravação da ordem de serviço.',
      );
    }

    const order = stringValue(response, 'ordem', 'numOS', 'numero') || fallbackOrder;
    if (!order) {
      throw new AppError(
        502,
        'UPSTREAM_INVALID_RESPONSE',
        'O Protheus confirmou a gravação, mas não retornou o número da ordem.',
      );
    }
    return order;
  }

  private async editorReferenceData(selectedOriginBranch = ''): Promise<object> {
    const branches = await this.branchOptions();
    return {
      branches,
      originBranches: this.originBranchOptions(branches, selectedOriginBranch),
      statuses: statusOptions,
      types: typeOptions,
      thirdPartyOptions,
    };
  }

  private lookupDefinition(type: LookupType, filter: string): LookupDefinition | null {
    const [branch = '', detail = '', extra = ''] = filter
      .split(';')
      .map((value) => sqlLiteral(value));
    const branchGroup = sharedBranch(branch);
    const definitions: Partial<Record<LookupType, LookupDefinition>> = {
      TJ_ORDEM: {
        table: 'STJ',
        fields: 'TJ_FILIAL,TJ_ORDEM,TJ_CODBEM,TJ_NOMBEM,TJ_DTORIGI',
        codeField: 'TJ_ORDEM',
        descriptionField: 'TJ_NOMBEM',
        baseWhere:
          `D_E_L_E_T_ = ' ' AND TJ_FILIAL = '${branch}' ` +
          `AND TJ_DTORIGI BETWEEN '${apiDate(detail)}' AND '${apiDate(extra)}' ` +
          `AND TJ_PLANO = '000000' AND TJ_ORDEPAI = '      '`,
        searchFields: ['TJ_ORDEM', 'TJ_CODBEM', 'TJ_NOMBEM'],
      },
      TJ_CODBEM: {
        table: 'ST9',
        fields: 'T9_CODBEM,T9_NOME,T9_PLACA,T9_ZZPLACA',
        codeField: 'T9_CODBEM',
        descriptionField: 'T9_NOME',
        baseWhere: "D_E_L_E_T_ = ' '",
        searchFields: ['T9_CODBEM', 'T9_NOME', 'T9_PLACA', 'T9_ZZPLACA'],
      },
      TJ_SERVICO: {
        table: 'ST4',
        fields: 'T4_SERVICO,T4_NOME',
        codeField: 'T4_SERVICO',
        descriptionField: 'T4_NOME',
        baseWhere: "D_E_L_E_T_ = ' ' AND T4_MSBLQL = '2' AND T4_TIPOMAN IN ('C01','C02')",
        searchFields: ['T4_SERVICO', 'T4_NOME'],
      },
      TJ_CODAREA: {
        table: 'CTT',
        fields: 'CTT_CUSTO,CTT_DESC01',
        codeField: 'CTT_CUSTO',
        descriptionField: 'CTT_DESC01',
        baseWhere: "D_E_L_E_T_ = ' ' AND CTT_BLOQ = '2'",
        searchFields: ['CTT_CUSTO', 'CTT_DESC01'],
      },
      TL_TAREFA: {
        table: 'TT9',
        fields: 'TT9_FILIAL,TT9_TAREFA,TT9_DESCRI',
        codeField: 'TT9_TAREFA',
        descriptionField: 'TT9_DESCRI',
        baseWhere: `D_E_L_E_T_ = ' ' AND TT9_FILIAL = '${branchGroup}'`,
        searchFields: ['TT9_TAREFA', 'TT9_DESCRI'],
      },
      TL_LOCAL: {
        table: 'NNR',
        fields: 'NNR_FILIAL,NNR_CODIGO,NNR_DESCRI',
        codeField: 'NNR_CODIGO',
        descriptionField: 'NNR_DESCRI',
        baseWhere: `D_E_L_E_T_ = ' ' AND NNR_FILIAL = '${branchGroup}'`,
        searchFields: ['NNR_CODIGO', 'NNR_DESCRI'],
      },
      TL_LOCALIZ: {
        table: 'SBE',
        fields: 'BE_FILIAL,BE_LOCAL,BE_LOCALIZ,BE_DESCRIC',
        codeField: 'BE_LOCALIZ',
        descriptionField: 'BE_DESCRIC',
        baseWhere: `D_E_L_E_T_ = ' ' AND BE_FILIAL = '${branch}' ` + `AND BE_LOCAL = '${detail}'`,
        searchFields: ['BE_LOCALIZ', 'BE_DESCRIC'],
      },
      TL_FORNEC: this.supplierLookup(branch),
    };

    if (type === 'TL_CODIGO') {
      return this.supplyCodeLookup(branch, detail);
    }
    return definitions[type] ?? null;
  }

  private supplyCodeLookup(branch: string, type: string): LookupDefinition | null {
    const branchGroup = sharedBranch(branch);
    const definitions: Partial<Record<SupplyType, LookupDefinition>> = {
      M: {
        table: 'ST1',
        fields: 'T1_FILIAL,T1_CODFUNC,T1_NOME',
        codeField: 'T1_CODFUNC',
        descriptionField: 'T1_NOME',
        baseWhere: `D_E_L_E_T_ = ' ' AND T1_FILIAL = '${branch}'`,
        searchFields: ['T1_CODFUNC', 'T1_NOME'],
      },
      P: {
        table: 'SB1',
        fields: 'B1_FILIAL,B1_COD,B1_DESC',
        codeField: 'B1_COD',
        descriptionField: 'B1_DESC',
        baseWhere: `D_E_L_E_T_ = ' ' AND B1_FILIAL = '${branchGroup}'`,
        searchFields: ['B1_COD', 'B1_DESC'],
      },
      T: this.supplierLookup(branch),
      E: {
        table: 'ST0',
        fields: 'T0_FILIAL,T0_ESPECIA,T0_NOME',
        codeField: 'T0_ESPECIA',
        descriptionField: 'T0_NOME',
        baseWhere: `D_E_L_E_T_ = ' ' AND T0_FILIAL = '${branchGroup}'`,
        searchFields: ['T0_ESPECIA', 'T0_NOME'],
      },
    };

    // O ASPX também não implementa consulta para o tipo F (Ferramenta).
    return definitions[type as SupplyType] ?? null;
  }

  private supplierLookup(branch: string): LookupDefinition {
    const branchGroup = sharedBranch(branch);
    return {
      table: 'SA2',
      fields: 'A2_FILIAL,A2_COD,A2_LOJA,A2_NOME',
      codeField: 'A2_COD',
      descriptionField: 'A2_NOME',
      baseWhere: `D_E_L_E_T_ = ' ' AND A2_FILIAL = '${branchGroup}' ` + `AND A2_MSBLQL = '2'`,
      searchFields: ['A2_COD', 'A2_NOME'],
    };
  }

  private async loadDescriptions(
    table: string,
    codeField: string,
    descriptionField: string,
    codes: ReadonlyArray<string>,
  ): Promise<ReadonlyMap<string, string>> {
    const normalizedCodes = uniqueValues(codes);
    if (normalizedCodes.length === 0) {
      return new Map<string, string>();
    }

    const values = normalizedCodes.map((code) => `'${sqlLiteral(code)}'`).join(',');
    const records = await this.client.genericQuery({
      table,
      fields: `${codeField},${descriptionField}`,
      where: `D_E_L_E_T_ = ' ' AND ${codeField} IN (${values})`,
    });
    return descriptionMap(records, codeField, descriptionField);
  }

  private async loadLookupDescriptions(
    definition: LookupDefinition | null,
    codes: ReadonlyArray<string>,
  ): Promise<ReadonlyMap<string, string>> {
    const normalizedCodes = uniqueValues(codes);
    if (!definition || normalizedCodes.length === 0) {
      return new Map<string, string>();
    }

    const values = normalizedCodes.map((code) => `'${sqlLiteral(code)}'`).join(',');
    const records = await this.client.genericQuery({
      table: definition.table,
      fields: definition.fields,
      where: `${definition.baseWhere} AND ` + `${definition.codeField} IN (${values})`,
    });
    return descriptionMap(records, definition.codeField, definition.descriptionField);
  }

  private async branchOptions(): Promise<ReadonlyArray<BranchOption>> {
    const records = await this.client.establishments();
    const options = new Map<string, BranchOption>();

    for (const record of records) {
      const value = establishmentBranchCode(record);
      const label = establishmentLabel(record);
      if (value && label && !options.has(value)) {
        options.set(value, { label, value });
      }
    }

    if (options.size === 0) {
      throw new AppError(
        502,
        'UPSTREAM_INVALID_RESPONSE',
        'O Protheus não retornou filiais válidas.',
      );
    }

    return [
      { label: 'Selecione', value: '' },
      ...[...options.values()].sort((left, right) =>
        left.label.localeCompare(right.label, 'pt-BR'),
      ),
    ];
  }

  private originBranchOptions(
    branches: ReadonlyArray<BranchOption>,
    selectedOriginBranch: string,
  ): ReadonlyArray<BranchOption> {
    if (!selectedOriginBranch) {
      return branches;
    }

    const selectedLabel = originBranchLabel(selectedOriginBranch, branches);
    const normalizedSelectedLabel = comparableText(selectedLabel);
    let selectedWasMapped = false;
    const options = branches.map((branch): BranchOption => {
      if (branch.value && comparableText(branch.label) === normalizedSelectedLabel) {
        selectedWasMapped = true;
        return { label: selectedLabel, value: selectedOriginBranch };
      }
      return branch;
    });

    if (!selectedWasMapped) {
      options.push({ label: selectedLabel, value: selectedOriginBranch });
    }

    const emptyOption = options.find((option) => option.value === '') ?? {
      label: 'Selecione',
      value: '',
    };
    return [
      emptyOption,
      ...options
        .filter((option) => option.value !== '')
        .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR')),
    ];
  }
}
