# Garbuio Portal — Ordem de Serviço em PO UI

Aplicação Angular 21 + PO UI para consulta e manutenção de ordens de serviço do
Protheus. O frontend mantém Redux e Redux-Saga; todas as operações assíncronas
passam pelas sagas e por um BFF Node/TypeScript.

## Arquitetura

```text
Componentes e páginas PO UI
          │ actions/selectors
          ▼
Redux ── Redux-Saga ── AuthApiService / OrderServiceApiService
                              │ /api/auth + /api/protheus
                              ▼
                     BFF Node/TypeScript
                              │ OAuth + Bearer
                              ▼
                         REST Protheus
```

O navegador nunca recebe `URLAPI`, usuário técnico, senha técnica ou token do
Protheus. O BFF:

- lê as credenciais do `.env`;
- solicita o token OAuth;
- mantém o token somente em memória;
- reutiliza o token até próximo da expiração;
- impede solicitações simultâneas de token;
- renova uma vez após resposta HTTP 401;
- aplica timeout, paginação limitada, validação e tratamento padronizado de erro.

O login do usuário é validado pelo OAuth nativo do Protheus. As credenciais são
enviadas ao BFF somente no login, sobre HTTPS, e não são gravadas no Redux, no
`localStorage` ou na sessão. O BFF devolve um identificador aleatório em cookie
`HttpOnly`, `SameSite=Strict`; grupo de empresa, data-base e filial ficam
associados a essa sessão. O grupo é sempre `01`.

As sessões estão em memória. Para múltiplas instâncias do BFF em produção,
substitua esse armazenamento por Redis ou equivalente, mantendo o mesmo
contrato e os mesmos atributos de cookie.

## Interface e tema

- tema `@totvs/po-theme` compatível com PO UI `21.24.0`;
- login com `po-page-login`;
- seleção de data-base, filial e tema claro/escuro antes da rotina;
- troca posterior de contexto pelo perfil da toolbar;
- páginas próprias para erros 403, 404 e 500;
- logo TOTVS servido por `public/totvs.svg`.

O repositório do tema informa que o pacote está em processo de descontinuação.
Ele foi mantido por ser a referência solicitada e pela compatibilidade com o
projeto; numa futura atualização principal do PO UI, revalide a estratégia.

## Premissas confirmadas no legado

- Autenticação: `POST /rest01/api/oauth2/v1/token`.
- Consulta original de OS: `GET /rest01/api/v1/CorrectiveServiceOrder`.
- Inclusão de OS: `POST /rest01/api/v1/CorrectiveServiceOrder`.
- Alteração de OS: o método chamado `OrdemServicoPUT` na DLL utiliza `POST` com
  `filial` e `numOS`; o BFF preserva esse comportamento.
- Leitura de registros e lookups: `GET /rest01/api/framework/v1/genericQuery`.
- Não foi encontrada uma rota REST independente para gravar ou excluir insumo.
  O legado reintegra a OS completa; o BFF faz o mesmo pela rota confirmada de OS.
- A pesquisa de Ferramenta (`F`) não foi implementada no ASPX e continua
  retornando uma lista vazia.
- Filiais e filiais de origem são carregadas de
  `GET /restmeurh01/establishment`. O código retornado é mantido como valor
  técnico para o Protheus e o nome do estabelecimento é apresentado nos
  selects.

A rota original de consulta omite ordens terminadas. Para atender à listagem de
todas as OS do período, a busca da tela usa a consulta nomeada da STJ pelo
`genericQuery`. Número da ordem e situação são opcionais; quando vazios, somente
período e filial são aplicados.

As listagens de OS e as pesquisas auxiliares, incluindo a busca de Bem, usam
paginação no servidor. A tela começa na página 1 e permite consultar 10, 50 ou
100 registros por página. Trocar de página executa uma nova chamada pela saga,
sem manter milhares de registros no navegador.

Os filtros de Ordem e Placa possuem lookup paginado. Ordem consulta a STJ,
respeitando filial e período; Placa consulta o código do bem (`TJ_CODBEM`). O
botão **Limpar filtros** retorna ao período e à filial do contexto selecionado.

O payload legado possui três propriedades `obs` repetidas para observação,
fornecedor e loja do insumo. Como JSON com chaves duplicadas é ambíguo, o BFF
envia somente a propriedade confirmada `obs` para observação e não inventa nomes
de campos para fornecedor/loja. O contrato Protheus precisa ser confirmado antes
de integrar esses dois valores.

## Requisitos

- Node.js `>=24`;
- Yarn Classic `1.22.22` via Corepack;
- acesso HTTPS ao servidor Protheus.

## Configuração

O arquivo `.env` real está ignorado pelo Git. Para criar outro ambiente:

```powershell
Copy-Item .env.example .env
```

Variáveis:

| Variável                      | Uso                                             |
| ----------------------------- | ----------------------------------------------- |
| `PORT`                        | Porta local do BFF                              |
| `PROTHEUS_ID_EMPRESA`         | Identificador da empresa, usado no diagnóstico  |
| `PROTHEUS_BASE_URL`           | Domínio HTTPS do REST Protheus                  |
| `PROTHEUS_API_USERNAME`       | Usuário técnico da API                          |
| `PROTHEUS_API_PASSWORD`       | Senha do usuário técnico                        |
| `PROTHEUS_DEFAULT_USER_CODE`  | Matrícula opcional usada no payload da OS       |
| `PROTHEUS_REQUEST_TIMEOUT_MS` | Timeout de comunicação                          |
| `PROTHEUS_PAGE_SIZE`          | Lote interno de consultas completas/diagnóstico |
| `PROTHEUS_MAX_PAGES`          | Limite defensivo de paginação                   |
| `SESSION_TTL_MINUTES`         | Validade da sessão do portal                    |
| `LOGIN_MAX_ATTEMPTS`          | Limite de tentativas inválidas na janela        |
| `LOGIN_WINDOW_MINUTES`        | Janela do limitador de login                    |
| `SESSION_COOKIE_SECURE`       | Exige HTTPS para envio do cookie de sessão      |

Não use prefixo `NG_APP_` ou outra forma de injetar essas variáveis no build
Angular; isso exporia os valores no navegador.

## Instalação e execução

No PowerShell, a partir de `C:\Node-Projects\GarbuioPortal\web`:

```powershell
corepack yarn install
corepack yarn dev
```

Se o comando global `yarn` estiver disponível, o equivalente é:

```powershell
yarn install
yarn dev
```

Abra `http://localhost:4200`. O Angular usa `proxy.conf.json` para encaminhar
`/api` ao BFF em `http://127.0.0.1:3000`. Entre com um usuário válido do
Protheus, selecione a data-base e a filial e prossiga para a lista de ordens.

Todas as rotas `/api/protheus` exigem cookie de sessão e contexto selecionado.
`page` começa em 1 e `pageSize` aceita somente `10`, `50` ou `100`.

Para localizar uma OS sem filtros ou diagnosticar a paginação:

```powershell
corepack yarn diagnose:order 171886
corepack yarn diagnose:search 2026-07-01 2026-07-31 0101
```

## Validação e build

```powershell
corepack yarn typecheck:all
corepack yarn test
corepack yarn build
```

O comando `test` executa os testes Angular existentes. As consultas reais de
paginação podem ser validadas pelas rotas internas documentadas acima, sem
expor credenciais no navegador.

## Fluxo Redux-Saga

1. A página despacha uma action `...REQUESTED`.
2. A saga chama `OrderServiceApiService`.
3. O serviço acessa exclusivamente `/api/auth` ou `/api/protheus`.
4. O BFF valida a sessão, autentica a integração e chama o REST Protheus.
5. A saga despacha sucesso ou erro e exibe a notificação PO UI.
6. O reducer atualiza loading, dados e erro.
7. Componentes e páginas leem o estado pelos selectors.

Consultas e lookups usam `takeLatest`. Inclusões, alterações e exclusões usam
`takeLeading`, evitando submissões concorrentes. Os botões também permanecem
bloqueados enquanto a operação está em andamento.

## Produção

O BFF escuta somente em `127.0.0.1`. Em produção, execute-o como serviço no
servidor web e configure o reverse proxy para encaminhar `/api` ao BFF. O
frontend pode continuar publicado no IIS; não publique o `.env` nem disponibilize
a porta `3000` externamente.

A configuração específica do IIS/ARR não foi adicionada porque os módulos,
bindings e autenticação do servidor não foram fornecidos.

## Estrutura principal

```text
server/
├── auth-session.ts
├── config.ts
├── contracts.ts
├── errors.ts
├── index.ts
├── order-service.ts
├── protheus-client.ts
└── validation.ts

src/app/
├── core/
│   ├── config/
│   ├── errors/
│   ├── http/
│   ├── notifications/
│   ├── state/
│   └── theme/
└── features/
    ├── auth/
    │   ├── guards/
    │   ├── models/
    │   ├── pages/
    │   ├── services/
    │   └── store/
    ├── errors/
    └── order-service/
        ├── components/
        ├── models/
        ├── pages/
        ├── services/
        └── store/
```

Veja também [docs/INTEGRACAO-REST-PROTHEUS.md](docs/INTEGRACAO-REST-PROTHEUS.md).
