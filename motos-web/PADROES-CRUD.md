# Padrões de CRUD — Monarca Bike

**Siga este documento em todo cadastro novo, sem o usuário precisar pedir.** Vale para API (`motos-api`) e front (`motos-web`). Não inventar outro layout, outra pasta, modal de form ou cliente HTTP diferente.

## Estrutura de tela

Cada cadastro usa **dois modos** no mesmo componente:

| Modo | Quando | UI |
|------|--------|-----|
| **Lista** | Padrão | Cabeçalho + busca + tabela + paginação |
| **Formulário** | Novo / Editar | Link “← Voltar para a lista” + card com campos |

- **Não** usar modal para formulário principal de cadastro.
- **Early return**: `if (formAberto) return <Formulario ... />`.
- Largura do form: `max-w-xl` (cadastros simples) ou `max-w-5xl` (formulários com muitos campos, ex.: pessoa, produto).
- Tela grande: extrair para `src/components/NomePage.tsx` (como `EmpresaPage`, `ProdutosPage`). Não inchir `App.tsx`.

## Navegação do menu

- Clicar **de novo** no mesmo item do menu deve **voltar à lista** (fechar form, limpar seleção).
- Implementação: `navReset` no `AppShell` + hook `useCrudReset(navReset, resetLista)`.
- `resetLista` deve fazer: `setFormAberto(false)`, `setEditando(null)` e, se houver painel lateral, `setSelected(null)`.

```tsx
const resetLista = useCallback(() => {
  setFormAberto(false);
  setEditando(null);
  setSelected(null);
}, []);
useCrudReset(navReset, resetLista);
```

Cadastro usado por **adm, gestor e operador** entra em **Operação** (o operador não vê Cadastros). Cadastro só de configuração fica em Cadastros.

## Lista (estilo Google Drive)

- Tabela com classes `drive-table w-full` (ver `src/index.css`).
- Cabeçalhos: `Th` / células: `Td` — em telas novas usar `@/components/crud/ListUi`.
- Linhas clicáveis: `drive-row-clickable`; selecionada: `drive-row-selected`.
- Espaçamento compacto (`drive-th` 8px/16px, `drive-td` 10px/16px; linha ~44–48px), hover suave, borda só entre linhas.
- Paginação: `TablePagination` + `slicePage` + `PAGE_SIZE` (10) de `@/format`.
- Ordenação: `useListSort` + `TableHeadRow` com `sort` nas colunas úteis (`@/components/crud/ListUi`). **Padrão: `id` crescente.** Clique no cabeçalho ordena; clique de novo inverte. Status e ações não ordenam. Busca/filtro/ordenação resetam a página para 1.
- Busca local no front filtrando nome/campos principais; resetar `page` para 1 ao mudar busca **ou** filtro de status.
- Filtro de status em **todo cadastro com ativo/inativo**: segmento **Todos | Ativos | Inativos** (`StatusFilter` + `passaFiltroStatus` em `@/components/crud/ListUi`), ao lado da busca. **Padrão: Todos.** Contagem do cabeçalho continua o total carregado; a paginação usa o recorte filtrado. Tipos de documento não têm status — sem o filtro.
- Produto: nome é editável (obrigatório). Sem edição, segue marca + modelo; link dourado “Usar marca e modelo” restaura. Na lista, sem coluna de marca: nome automático mostra marca (muted) + modelo (semibold) na mesma linha; nome customizado é uma linha só. Nome **não** usa `clip` (quebra linha se precisar). Preço de lista alinhado à direita; disponível como `{n} un.`. Código no cadastro novo já vem preenchido com o próximo ID (editável; rótulo “sugerido” some ao mudar). Se o código ficar vazio, a API grava o ID real. SKU é único entre produtos não deletados (`PRODUTO_CODIGO_DUPLICADO`). Status na lista usa o mesmo selo liga/desliga de cliente/fornecedor.
- Cliente e fornecedor: colunas código, nome, documento (só o número mascarado; `title` com tipo+número), cidade (`Nome - UF - País`), status, ações. Sem telefone/país separados na lista (telefone na ficha). Status fica colado no menu (⋮) e o selo **Ativo/Inativo** liga/desliga o cadastro. Nome e cidade usam `clip` só no caso raro de texto muito longo (`title` com o valor completo).

## Cabeçalho da lista

Use `CatalogHeader` (`@/components/crud/ListUi`):

- Título (`text-xl`, font display)
- Subtítulo: `{count} cadastrados`
- Botão dourado: `Novo {singular}`

## Formulário

- Card: `rounded-lg p-5` ou `p-6`, `background: var(--card)`, borda `--border`.
- Campos: `Field` e `Section` de `@/components/crud/Field`.
- Cadastros longos (cliente, fornecedor, produto): **guias** com `FormTabs` no topo do card. 3–4 abas no máximo. **Um Salvar** no rodapé (produto novo também tem **Salvar e novo**: grava e abre outro cadastro em branco; **Salvar** volta à lista). A validação troca para a guia do campo. Tab ou Enter no último campo da guia abre a próxima. Não aninhar aba dentro de aba nem usar modal.
- Layout em 2 colunas em telas largas: classe `form-grid-2`.
- Botões no rodapé: **Cancelar** (`btn-ghost`) + **Salvar** (`btn-gold`).
- Normalização ao salvar/blur:
  - Nomes: `toTitleCase`
  - E-mail: `toEmailLower`
  - Documentos/CEP/telefone: `apenasDigitos` quando aplicável
  - SKU/código/chassi: trim + maiúsculas

## Filial (obrigatório quando o cadastro é por filial)

Mesma regra de cliente e fornecedor:

- Listar/criar/excluir usam a filial do switcher (`useFilialId()` / `idFilial` na API).
- Conferir acesso do usuário à filial (`temAcessoFilial`).
- Parâmetro em **Empresa → parâmetros da filial**: `listarApenas*Filial` (default `true`).
  - Ligado: lista só o que está vinculado à filial atual (`*_filial`).
  - Desligado: lista o cadastro da empresa inteira.
- Criar já vincula à filial atual (`idFilialCadastro`).
- Se o registro já existe **neste papel** (mesmo documento): HTTP 409 com `idPapel` e o front **abandona o novo** e abre o cadastro existente (`Abrir cadastro`). Se a pessoa existe sem este papel, oferece vincular. Se já existe em outra filial: HTTP 409 `VINCULO_FILIAL` e o front pede confirmação.
- DELETE com `?idFilial=` remove o **vínculo** daquela filial; sem `idFilial` soft-delete o cadastro.

**Perfil fiscal** (`perfil_fiscal` na filial, default `py_iva`): motor da factura desta sucursal. País vem da cidade. Hoje só IVA Paraguai. Brasil (quando existir): outra **empresa** com CNPJ; valores `br_pendente` / `br_simples` / `br_presumido` / `br_real` filtrados pela cidade; não misturar com `py_iva`. Alíquota fica no produto.

## Cotação do dia

- Uma cotação por data (fuso `America/Asuncion`): taxas obrigatórias **USD→PYG** e **BRL→PYG**. Só **adm e gestor** informam (`cotacao:gerenciar`). Operador e vendedor só consultam.
- Sem cotação **ativa** no dia, cadastros continuam liberados. A API responde 403 `COTACAO_DIA_AUSENTE` só em vendas, recebimentos, pagamentos e facturas/NF-e (e `CotacaoService.exigirAtiva()` nesses services). O front mostra um **alerta fixo no topo** (não é modal e não se dispensa): adm/gestor informam as taxas ali mesmo; os demais veem o aviso. Com cotação ativa, um chip no topo mostra as taxas do dia.
- A cotação do mesmo dia pode ser editada. Data futura é rejeitada. Menu **Operação → Cotações** (só adm/gestor).
- Produto: IVA 0/5/10 (default 10) é metadado da factura. O preço de gôndola **já inclui IVA**; a venda não soma 0/5/10% em cima. Um preço de lista e custo na **moeda de operação da filial** (parâmetro em Empresa → parâmetros da filial; default USD). Quem cadastra produto não escolhe moeda. O PDV e o cadastro mostram o equivalente nas outras duas (Gs. / US$ / R$) pela cotação do dia. Recebimento da venda continua nas três moedas.
- **Estoque padrão da venda:** um por filial, parâmetro de sistema em **Empresa → parâmetros da filial** (`filial.id_estoque_padrao`), igual à moeda de operação. Não há flag no cadastro de estoque. A venda e o saldo exibido no PDV/lista usam só esse depósito. Os demais existem para transferência (sem tela de transferência ainda). O primeiro estoque da filial vira o padrão; trocar só no parâmetro da filial. Não dá para inativar o estoque padrão.
- **Caixa e venda:** cadastro de `finalizador` e `caixa` (por filial) em Cadastros (adm/gestor). Operação: abrir/fechar sessão com conferência, transferir entre caixas abertos da mesma filial, e PDV (`venda` + `venda_item` + `venda_negociacao` em N formas). Cada linha de pagamento tem **forma + moeda** (`pyg`/`usd`/`brl`); `valor` é o recebido na moeda e `valor_pyg` fecha a venda pela cotação do dia. O caixa guarda a mesma tríade; saldo e conferência são por forma+moeda. Troco fica para depois. Venda baixa estoque e lança movimento no caixa na mesma transação. Abertura de caixa não exige cotação; venda exige. Acesso em `usuario_caixa` (um padrão). RBAC: `caixa:gerenciar`, `caixa:operar`, `venda:registrar`. `venda.id_vendedor` é o **usuário** ativo da filial (não há CRUD de vendedor); o PDV inicia com o logado e **Trocar** escolhe outro. Operador do caixa continua sendo quem está autenticado.
- **PDV (Operação → Vendas):** tela sempre aberta (catálogo em cards + carrinho). Não mistura lista e não tem “Nova venda”. Após finalizar, o carrinho zera, permanece no PDV e o foco volta à busca. Clicar de novo em Vendas (`navReset`) limpa o carrinho. Pagamento (formas + Gs./US$/R$) é o **segundo passo** do painel direito: o operador monta o carrinho e clica **Ir para pagamento**; não é modal e não fica visível enquanto lança itens. A vitrine mostra até 24 produtos com estoque (busca até 48), ordenados por quantidade; o leitor/código consulta o catálogo inteiro da filial.
- **Histórico (Operação → Histórico):** lista `drive-table` + detalhe (sem modal, sem “Novo”). Mesma permissão `venda:registrar`. Caixa do dia continua em Operação → Caixa.

## Entidade geral + específica

Quando o cadastro tem um núcleo comum e fichas diferentes (pessoa+papel, produto+moto/bicicleta):

- Tabela geral com `id` (gerado, imutável) e campos de todos.
- Tabela 1:1 por tipo (`produto_moto`, `produto_bicicleta`) com FK para o geral.
- Enum `tipo` no geral; **não** mudar o tipo depois de criado.
- Não criar tipo “reservado” para o futuro (ex.: peça). Quando surgir, nova tabela + valor no enum.
- Form: guias **Cadastro** | **Ficha técnica** | **Preço e IVA** | **Estoque**. No **cadastro novo**, a guia Estoque tem quantidade inicial (padrão 0) que entra no estoque padrão da filial; os demais depósitos ficam zerados. Na **edição**, a guia é somente leitura — quantidade se ajusta em Operação → Estoques.

## Backend

Camadas fixas por módulo: `domain` → `dto` → `repository` (interface + Exposed + Tables) → `service` → `http` (Resources + Routing) → `*Module.kt` no Koin.

- Tabelas novas: migration Flyway `V{n}__descricao.sql` (**nunca** editar migration já aplicada).
- Exposed **não** cria tabela.
- IDs `BIGINT IDENTITY`. Soft delete via `status` (`ativo` / `inativo` / `deletado`).
- Nomes de tabela no singular, colunas snake_case.
- Rotas JWT + RBAC (`podeConsultar*` / `podeGerenciar*`). Permissão `{modulo}:{verbo}`.
- Mutação com `withAudit` (coloca o usuário no contexto para `audit_logs`).
- Insert composto (ex.: produto + `produto_filial` + `estoque_produto`, quantidade inicial só no estoque padrão) entra no **mesmo** `suspendTransaction`. Se faltar saldo em algum estoque da filial, ou falhar o insert em `audit_logs`, a transação aborta — não fica produto sem estoque nem estoque sem log.
- `audit_logs` do insert composto é gravado **dentro** dessa transação (`gravarAuditLog`), não num `suspendTransaction` separado depois do commit.
- Validação e regra de negócio no service; 400 / 403 / 404 / 409 no routing.
- Teste de integração em `motos-api/src/test/kotlin/`.

## API client (`src/api.ts`)

- Funções: `listar*`, `criar*`, `atualizar*`, `excluir*`.
- Tipos no mesmo arquivo, camelCase igual ao JSON da API.
- Erros: `ApiError` com `status` e `body`.
- Proxy em `vite.config.ts` para cada prefixo novo (`/produtos`, `/estoques`, …).

## i18n (obrigatório em toda tela e API)

Na troca de idioma, **tudo que é estático** deve aparecer traduzido, com gramática correta de cada língua (**pt** e **es**). Não deixar label, botão, placeholder, hint, confirmação, menu, título, status ou erro em um idioma só.

**Traduzir:** qualquer string escrita no código. Chave em `TranslationKey` + valor em `src/i18n/translations.ts` (pt e es). Nav: `nav.{id}` igual ao `View`. Validação de formulário com `t(...)`.

**Não traduzir:** valor que veio do banco (nome de marca, cidade, RUC, SKU, tipo de documento cadastrado). Isso permanece como o usuário gravou.

**Exceção — status:** o enum do banco (`ativo` / `inativo`) **não** aparece cru. Sempre `StatusBadge` / `t("common.active")` e `t("common.inactive")` (pt: Ativo / Inativo; es: Activo / Inactivo).

**Erros da API:** JSON `{ codigo, message, params }`. O `message` em português é só log/teste. A UI usa `mensagemErroApi` → chave `api.{CODIGO}` (placeholders `{campo}` via `params`). No service: `invalido("CODIGO", "frase pt", "campo" to valor)`. Nunca mostrar `e.message` cru na tela. Novo erro = novo código + `api.CODIGO` em pt e es.

## Documentos (BR / PY)

| Código | Normalização no banco | Validação |
|--------|----------------------|-----------|
| **CPF** | Só 11 dígitos | Dígitos verificadores (módulo 11) |
| **CNPJ** | 14 caracteres maiúsculos | Numérico legado **ou** alfanumérico (Receita Federal); DV módulo 11 |
| **CI** (PY) | Só dígitos | 6 a 10 dígitos (estrutura) |
| **RUC** (PY) | `BASE-DV` (ex.: `80009735-1`) | Dígito verificador módulo 11 (DNIT) |
| **Outros tipos / países** | Letras e números, maiúsculas | Sem validação de formato |

A API rejeita documento inválido com HTTP 400. O front pode exibir com máscara, mas o valor persistido é o normalizado.

## Pessoa (cliente / fornecedor)

- Form em **2 guias** (`FormTabs`): Dados | Endereços. Um Salvar. **Documento** (país + tipo + número) fica no topo de Dados, **acima** da identificação. Ao sair do número, a API consulta se o documento já existe e oferece Abrir cadastro / vincular. Identificação e contato em **2 colunas** abaixo.
- **DDI**: `DdiSearchSelect` — busca por país, sigla ou código; opção “Outro” para DDI manual.
- **CEP**: label **“CEP / Código Postal”** (até 12 dígitos).
- **Documento**: país + tipo (catálogo) + número; link “Gerenciar tipos de documento” → menu Cadastros → Tipos de documento.
- Tipos de documento vêm da API `GET /documentos-tipos?idPais=&tipoPessoa=`.

## Checklist para novo CRUD

1. Migration SQL (se necessário)
2. Domain + repository + service + routing + Koin + `application.yaml` + RBAC
3. Filial: vínculo, parâmetro `listarApenas*`, acesso do usuário (se o cadastro for por filial)
4. Funções e tipos em `api.ts` + proxy no Vite
5. Item no menu + `View` + render no `AppShell`
6. Página lista + form + `useCrudReset` + `drive-table`
7. Chaves i18n pt/es (tela + `api.CODIGO` se a API puder devolver erro novo)
8. Teste de integração na API
