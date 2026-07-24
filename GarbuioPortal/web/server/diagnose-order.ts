import { serverConfig } from './config.js';
import { ProtheusRecord } from './contracts.js';
import { ProtheusClient } from './protheus-client.js';

function field(record: ProtheusRecord, name: string): unknown {
  const normalizedName = name.toLocaleLowerCase('en-US');
  const entry = Object.entries(record).find(
    ([key]) => key.toLocaleLowerCase('en-US') === normalizedName,
  );
  return entry?.[1] ?? '';
}

async function main(): Promise<void> {
  const order = process.argv[2]?.trim() ?? '';
  if (!/^[A-Za-z0-9._/-]+$/.test(order)) {
    throw new Error('Uso: corepack yarn diagnose:order NUMERO_DA_OS');
  }

  const client = new ProtheusClient(serverConfig);
  const records = await client.genericQuery({
    table: 'STJ',
    fields:
      'TJ_FILIAL,TJ_ORDEM,TJ_DTORIGI,TJ_SITUACA,TJ_PLANO,TJ_TERMINO,' +
      'TJ_ORDEPAI,TJ_XINTEGR,TJ_CODBEM,TJ_NOMBEM,TJ_SERVICO,TJ_NOMSERV,' +
      'TJ_CODAREA,TJ_CCUSTO,TJ_NOMAREA,TJ_XORIG,TJ_DTPRINI,TJ_HOPRINI,' +
      'TJ_USUAINI,TJ_USUARIO',
    where: `D_E_L_E_T_ = ' ' AND TJ_ORDEM = '${order.replace(/'/g, "''")}'`,
  });

  console.info(
    JSON.stringify(
      {
        count: records.length,
        records: records.map((record) => ({
          branch: field(record, 'TJ_FILIAL'),
          order: field(record, 'TJ_ORDEM'),
          originalDate: field(record, 'TJ_DTORIGI'),
          status: field(record, 'TJ_SITUACA'),
          assetCode: field(record, 'TJ_CODBEM'),
          assetName: field(record, 'TJ_NOMBEM'),
          serviceCode: field(record, 'TJ_SERVICO'),
          serviceName: field(record, 'TJ_NOMSERV'),
          costCenterCode: field(record, 'TJ_CCUSTO') || field(record, 'TJ_CODAREA'),
          costCenterName: field(record, 'TJ_NOMAREA'),
          originBranch: field(record, 'TJ_XORIG'),
          startDate: field(record, 'TJ_DTPRINI'),
          startTime: field(record, 'TJ_HOPRINI'),
          inclusionUser: field(record, 'TJ_USUAINI'),
          changeUser: field(record, 'TJ_USUARIO'),
          plan: field(record, 'TJ_PLANO'),
          finished: field(record, 'TJ_TERMINO'),
          parentOrder: field(record, 'TJ_ORDEPAI'),
          integrationId: field(record, 'TJ_XINTEGR'),
        })),
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Falha ao consultar a OS.');
  process.exitCode = 1;
});
