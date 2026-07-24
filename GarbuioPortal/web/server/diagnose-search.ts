import { serverConfig } from './config.js';
import { ProtheusRecord } from './contracts.js';
import { OrderService } from './order-service.js';
import { ProtheusClient } from './protheus-client.js';

function field(record: ProtheusRecord | undefined, name: string): unknown {
  if (!record) {
    return '';
  }
  const normalizedName = name.toLocaleLowerCase('en-US');
  const entry = Object.entries(record).find(
    ([key]) => key.toLocaleLowerCase('en-US') === normalizedName,
  );
  return entry?.[1] ?? '';
}

async function main(): Promise<void> {
  const startDate = (process.argv[2] ?? '').replace(/\D/g, '');
  const endDate = (process.argv[3] ?? '').replace(/\D/g, '');
  const branch = process.argv[4]?.trim() ?? '';
  if (startDate.length !== 8 || endDate.length !== 8 || !/^[A-Za-z0-9]+$/.test(branch)) {
    throw new Error('Uso: corepack yarn diagnose:search AAAA-MM-DD AAAA-MM-DD FILIAL');
  }

  const client = new ProtheusClient(serverConfig);
  const query = {
    table: 'STJ',
    fields: 'TJ_FILIAL,TJ_ORDEM,TJ_DTORIGI,TJ_SITUACA,TJ_TERMINO',
    where:
      `D_E_L_E_T_ = ' ' AND TJ_FILIAL = '${branch}' ` +
      `AND TJ_DTORIGI BETWEEN '${startDate}' AND '${endDate}' ` +
      "AND TJ_PLANO = '000000' AND TJ_ORDEPAI = '      '",
  };
  const pages = [];

  for (const pageNumber of [1, 20, 50, 75, 90, 99, 100]) {
    const page = await client.genericQueryPage(query, pageNumber);
    pages.push({
      page: pageNumber,
      count: page.items.length,
      hasNext: page.hasNext,
      firstOrder: field(page.items[0], 'TJ_ORDEM'),
      lastOrder: field(page.items.at(-1), 'TJ_ORDEM'),
    });
  }

  const orders = await new OrderService(client, serverConfig).searchOrders(
    {
      startDate: process.argv[2] ?? '',
      endDate: process.argv[3] ?? '',
      branch,
      status: '',
      order: '',
      plate: '',
    },
    1,
    100,
  );

  console.info(
    JSON.stringify(
      {
        pageSize: serverConfig.pageSize,
        maxPages: serverConfig.maxPages,
        returnedOrders: orders.items.length,
        hasNext: orders.hasNext,
        contains171886: orders.items.some((order) => order.order === '171886'),
        pages,
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Falha ao diagnosticar a consulta.');
  process.exitCode = 1;
});
