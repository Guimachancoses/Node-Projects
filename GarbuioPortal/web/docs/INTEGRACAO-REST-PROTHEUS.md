# Integração REST Protheus

## Escopo

Esta implementação substitui o consumo direto dos PageMethods ASPX por um BFF.
A análise foi feita a partir de:

- `ordemservicoview.aspx.cs`;
- `ordemservico.aspx.cs`;
- `ordemservicoinsumo.aspx.cs`;
- DLL `AppLibBase.External.Protheus`;
- contratos e payloads extraídos da rotina atual.

## Rotas Protheus confirmadas

| Operação             | Método | Rota                                                         |
| -------------------- | ------ | ------------------------------------------------------------ |
| Token OAuth          | POST   | `/rest01/api/oauth2/v1/token`                                |
| Estabelecimentos     | GET    | `/restmeurh01/establishment`                                 |
| Consultar OS         | GET    | `/rest01/api/v1/CorrectiveServiceOrder`                      |
| Incluir OS           | POST   | `/rest01/api/v1/CorrectiveServiceOrder`                      |
| Alterar OS           | POST   | `/rest01/api/v1/CorrectiveServiceOrder?filial=...&numOS=...` |
| Consulta genérica    | GET    | `/rest01/api/framework/v1/genericQuery`                      |
| Parâmetro            | GET    | `/rest01/api/framework/v1/systemParameters/{parametro}`      |
| Atualizar parâmetro  | POST   | `/rest01/WSParam/update`                                     |
| Consulta customizada | POST   | `/rest01/queryapi`                                           |

O frontend não expõe `queryapi`, atualização de parâmetros ou uma consulta
genérica livre. Em vez disso, o BFF oferece apenas lookups nomeados, evitando que
o navegador envie tabela, campos ou cláusulas SQL arbitrárias.

As opções de filial são obtidas de `COD_ESTAB_ERP` e `DES_ESTAB`. O BFF retira
o prefixo da empresa de `COD_ESTAB_ERP` para manter o código de filial esperado
pelas tabelas Protheus e apresenta ao usuário somente o nome do estabelecimento.
A lista fica em cache no BFF por cinco minutos e requisições simultâneas
compartilham a mesma chamada.

A listagem usa uma consulta nomeada na STJ porque
`CorrectiveServiceOrder` não retornou ordens terminadas existentes. Os filtros de
número e situação só são adicionados quando preenchidos; com ambos vazios, a
consulta retorna todas as OS da filial dentro do período.

Tanto a listagem de OS quanto os lookups usam a paginação nativa do
`genericQuery`. O BFF aceita `page`, com índice inicial 1, e `pageSize`, limitado
a `10`, `50` ou `100`. Os valores padrão são `page=1` e `pageSize=10`.

## Rotas internas do BFF

| Método | Rota                                                      | Uso                       |
| ------ | --------------------------------------------------------- | ------------------------- |
| POST   | `/api/auth/login`                                         | Validar usuário no OAuth  |
| GET    | `/api/auth/session`                                       | Restaurar sessão          |
| PUT    | `/api/auth/context`                                       | Definir data-base/filial  |
| DELETE | `/api/auth/session`                                       | Encerrar sessão           |
| GET    | `/api/protheus/health`                                    | Validar autenticação      |
| GET    | `/api/protheus/reference-data`                            | Período, filiais e listas |
| GET    | `/api/protheus/orders`                                    | Consultar ordens          |
| GET    | `/api/protheus/orders/new`                                | Defaults de inclusão      |
| GET    | `/api/protheus/orders/:filial/:ordem`                     | Carregar editor           |
| POST   | `/api/protheus/orders`                                    | Incluir OS                |
| PUT    | `/api/protheus/orders/:filial/:ordem`                     | Alterar OS                |
| GET    | `/api/protheus/orders/:filial/:ordem/supplies/editor`     | Editar insumo             |
| POST   | `/api/protheus/orders/:filial/:ordem/supplies`            | Incluir insumo            |
| PUT    | `/api/protheus/orders/:filial/:ordem/supplies/:sequencia` | Alterar insumo            |
| DELETE | `/api/protheus/orders/:filial/:ordem/supplies/:sequencia` | Excluir insumo            |
| GET    | `/api/protheus/lookups/:tipo`                             | Consultas auxiliares      |

Todas as rotas `/api/protheus` exigem sessão válida e contexto selecionado.
As chamadas mutáveis também exigem o cabeçalho
`X-Requested-With: XMLHttpRequest`. O cookie é `HttpOnly`,
`SameSite=Strict` e deve usar `Secure` em produção HTTPS.

O `PUT` interno expressa corretamente a intenção HTTP. Para atualizar no
Protheus, o BFF converte para o `POST` utilizado pela DLL legada.

As rotas `/api/protheus/orders` e `/api/protheus/lookups/:tipo` retornam:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "hasNext": false
}
```

`hasNext` vem da resposta do Protheus e habilita a navegação para a próxima
página. A troca de página mantém os filtros atuais e busca apenas o lote
solicitado.

## Consultas nomeadas

| Tipo         | Tabela | Código       | Descrição    |
| ------------ | ------ | ------------ | ------------ |
| `TJ_CODBEM`  | ST9    | `T9_CODBEM`  | `T9_NOME`    |
| `TJ_SERVICO` | ST4    | `T4_SERVICO` | `T4_NOME`    |
| `TJ_CODAREA` | CTT    | `CTT_CUSTO`  | `CTT_DESC01` |
| `TL_TAREFA`  | TT9    | `TT9_TAREFA` | `TT9_DESCRI` |
| Insumo M     | ST1    | `T1_CODFUNC` | `T1_NOME`    |
| Insumo P     | SB1    | `B1_COD`     | `B1_DESC`    |
| Insumo T     | SA2    | `A2_COD`     | `A2_NOME`    |
| Insumo E     | ST0    | `T0_ESPECIA` | `T0_NOME`    |
| `TL_LOCAL`   | NNR    | `NNR_CODIGO` | `NNR_DESCRI` |
| `TL_LOCALIZ` | SBE    | `BE_LOCALIZ` | `BE_DESCRI`  |
| `TL_FORNEC`  | SA2    | `A2_COD`     | `A2_NOME`    |

O filtro informado pelo usuário é limitado a 100 caracteres e aspas simples são
escapadas. Tabelas, campos e condições-base são definidos no servidor.

## Payload de OS preservado

O BFF envia os campos confirmados na DLL:

```json
{
  "id": "0",
  "filial": "01",
  "filial_origem": "01",
  "dt_original": "AAAAMMDD",
  "bem": "",
  "servico": "",
  "dt_inicio": "AAAAMMDD",
  "hr_inicio": "00:00",
  "situacao": "P",
  "obs": "",
  "terceiro": "1",
  "usuario": "",
  "cc": "",
  "dados": {
    "insumos": [],
    "etapas": [],
    "sintomas": []
  }
}
```

O exemplo não contém credenciais nem dados reais.

## Limitações mantidas

1. Não existe exclusão funcional de OS no ASPX analisado.
2. Não existe endpoint REST separado confirmado para salvar/excluir insumos.
3. O tipo Ferramenta não possui fonte de consulta implementada no ASPX.
4. A matrícula do usuário do portal ainda depende de configuração do servidor.
5. Fornecedor e loja do insumo aparecem como chaves `obs` duplicadas no payload
   legado. Eles não são enviados até que o contrato correto seja confirmado.

Essas limitações são explícitas para evitar a criação de endpoints, campos ou
regras de negócio sem evidência no sistema atual.
