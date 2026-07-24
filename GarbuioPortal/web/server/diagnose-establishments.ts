import { serverConfig } from './config.js';
import { ProtheusClient } from './protheus-client.js';

async function main(): Promise<void> {
  const response = await new ProtheusClient(serverConfig).establishments();
  console.info(JSON.stringify(response, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Falha ao consultar as filiais.');
  process.exitCode = 1;
});
