# Análise da rotina ASPX

> Este documento registra a análise e a primeira implementação baseada em
> PageMethods. A implementação atual usa o BFF REST descrito em
> [INTEGRACAO-REST-PROTHEUS.md](INTEGRACAO-REST-PROTHEUS.md).

## Escopo identificado

O módulo de Ordem de Serviço é composto por três páginas:

| Página                    | Responsabilidade                           |
| ------------------------- | ------------------------------------------ |
| `ordemservicoview.aspx`   | Filtrar e listar ordens                    |
| `ordemservico.aspx`       | Incluir/alterar cabeçalho e listar insumos |
| `ordemservicoinsumo.aspx` | Incluir/alterar um insumo                  |

O acesso depende das variáveis de sessão ASP.NET `Usuario`, `IdEmpresa`,
`IdUsuario` e `Perfil`. Inclusão/alteração verifica a permissão
`ORDEMSERVICO/CADASTRAR`.

## Funcionalidades preservadas

### Consulta

- período inicial/final;
- filial;
- situação: Pendente (`P`), Cancelada (`C`) e Liberada (`L`);
- número da ordem;
- tabela com situação, ordem, tipo, data, bem e serviço;
- acesso à edição pela filial e número da ordem.

Os valores iniciais de período, filial e listas são lidos da própria página
ASPX renderizada, mantendo os defaults calculados pelo servidor.

### Ordem de serviço

- ordem e situação bloqueadas para edição;
- tipo de OS;
- filial e filial de origem;
- data original;
- data/hora de início;
- indicador de terceiro;
- lookups de bem, serviço e centro de custo;
- usuários de inclusão/alteração somente leitura;
- observação;
- integração Protheus executada pelo backend após `Save()`;
- inclusão, alteração e exclusão de insumos.

### Insumo

- sequência somente leitura;
- lookup de tarefa;
- tipos `F`, `M`, `P`, `T` e `E`;
- lookup de insumo dependente do tipo;
- quantidade do recurso e quantidade;
- data/hora de início;
- almoxarifado, localização e fornecedor;
- número da SC somente leitura;
- nota fiscal e série;
- observação;
- integração Protheus executada pelo backend após `Save()`.

## Contratos legados utilizados

| Operação                      | Contrato existente                                          |
| ----------------------------- | ----------------------------------------------------------- |
| Carregar defaults da consulta | `GET ordemservicoview.aspx`                                 |
| Consultar ordens              | `POST ordemservicoview.aspx/ReadView`                       |
| Carregar ordem                | `GET ordemservico.aspx?Filial=...&Ordem=...`                |
| Nova ordem/defaults           | `GET ordemservico.aspx`                                     |
| Salvar ordem                  | `POST ordemservico.aspx/SaveRecord`                         |
| Lookup de ordem               | `POST ordemservico.aspx/ReadViewLookup`                     |
| Novo insumo/defaults          | `GET ordemservicoinsumo.aspx?Filial=...&IdOrdemServico=...` |
| Carregar insumo               | `GET ordemservicoinsumo.aspx?...&NSeq=...`                  |
| Salvar insumo                 | `POST ordemservicoinsumo.aspx/SaveRecord`                   |
| Lookup de insumo              | `POST ordemservicoinsumo.aspx/ReadViewLookup`               |
| Excluir insumo                | `POST ordemservico.aspx/DeleteRecordInsumo`                 |

Os PageMethods encapsulam a resposta no formato `{ "d": "..." }`.
Consultas/lookups retornam HTML; saves retornam strings delimitadas por `;`.

## Dados necessários

Não foram criados campos novos. Os payloads mantêm os nomes do ASPX:

- OS: `IdOrdemServico`, `TJ_ORDEM`, `TJ_SITUACA`, `TJ_TIPO`,
  `TJ_FILIAL`, `TJ_DTORIGI`, `TJ_FILORI`, `TJ_DTPPINI`, `TJ_HOPPINI`,
  `TJ_TERCEIR`, `TJ_CODBEM`, `TJ_SERVICO`, `TJ_OBSERVA`, `TJ_ZZLGI`,
  `TJ_ZZLGA`, `TJ_CODAREA`;
- insumo: `IdOrdemServico`, `NSeq`, `TL_FILIAL`, `TL_ORDEM`,
  `TL_TAREFA`, `TL_TIPOREG`, `TL_CODIGO`, `TL_QUANREC`, `TL_QUANTID`,
  `TL_DTINICI`, `TL_HOINICI`, `TL_OBSERVA`, `TL_LOCAL`, `TL_LOCALIZ`,
  `TL_FORNEC`, `TL_NOTFIS`, `TL_SERIE`.

## Arquitetura proposta e implementada

```text
Página PO UI
    │ dispatch/select
    ▼
Redux actions ──► Redux-Saga ──► serviço de API
    ▲                 │                 │
    │                 │                 ▼
selectors ◄── reducer/status     adaptador ASPX
                                      │
                                      ▼
                          PageMethods + sessão ASP.NET
```

- componentes: somente apresentação, formulários e eventos;
- páginas: navegação e despacho de actions;
- sagas: todas as operações assíncronas e notificações;
- serviço: comunicação HTTP e mapeamento de payloads;
- parser: conversão do HTML/string legado;
- reducer: estados de loading/sucesso/erro;
- selectors: leitura do estado sem acesso direto à store.

Na versão PO UI 21.24 não existe um seletor de componente `<po-form>`.
Por isso, os formulários usam Angular Reactive Forms com os campos oficiais
`po-input`, `po-select`, `po-datepicker`, `po-decimal` e `po-textarea`.
As mensagens usam o serviço oficial `PoNotificationService`.

## Divergências e defeitos encontrados

1. A imagem anexada é uma árvore React/Redux-Saga do projeto “Salon”; não é
   referência visual da tela e não pertence ao diretório ASPX analisado.
2. O projeto fornecido não contém Angular, Redux nem Saga. O frontend foi criado
   em `GarbuioPortal/web`.
3. `ReadViewInsumo()` é chamado pelo JavaScript como PageMethod, mas no C# é um
   método de instância privado, sem `[WebMethod]`. O Angular recarrega o editor
   ASPX após salvar/excluir e não chama esse contrato inválido.
4. O HTML legado gera `buttonEXCLUIRInsumo_Click(NSeq)`, mas a função JavaScript
   exige `(IdOrdemServico, NSeq)`. O Angular envia ambos corretamente ao
   PageMethod existente.
5. O lookup de fornecedor do JavaScript monta `Filtro` com o próprio fornecedor,
   embora o C# espere filial em `sFiltro[0]`. O Angular usa a filial. Esta é uma
   correção de defeito, não uma nova regra de negócio.
6. A descrição de fornecedor em `ReadRecord` percorre `listLocalizacao` em vez
   de `listFornecedor`. A resposta server-side pode exibir descrição incorreta;
   a correção definitiva deve ser feita no C#.
7. O lookup de almoxarifado usa filial fixa `"01"` dentro do C#. O frontend não
   altera essa regra porque ela está no backend.
8. `TL_NUMSC` está desabilitado e não faz parte do `SaveRecord` de insumo. Foi
   mantido somente leitura.
9. Não há exclusão de OS funcional. O código `DeleteRecord` usa entidades e
   permissão de Pedido e está comentado na interface.

## Arquivos de origem preservados

Nenhum arquivo ASPX, C# ou DLL do legado foi alterado. Toda a implementação nova
está isolada em `GarbuioPortal/web`.
