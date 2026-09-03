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
- Espaçamento generoso (`drive-th` / `drive-td`), hover suave, borda só entre linhas.
- Paginação: `TablePagination` + `slicePage` + `PAGE_SIZE` (10) de `@/format`.
- Busca local no front filtrando nome/campos principais; resetar `page` para 1 ao mudar busca.

## Cabeçalho da lista

Use `CatalogHeader` (`@/components/crud/ListUi`):

- Título (`text-xl`, font display)
- Subtítulo: `{count} cadastrados`
- Botão dourado: `Novo {singular}`

## Formulário

- Card: `rounded-lg p-5` ou `p-6`, `background: var(--card)`, borda `--border`.
- Campos: `Field` e `Section` de `@/components/crud/Field`.
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
- Se o registro já existe em outra filial (mesmo documento/SKU): HTTP 409 `VINCULO_FILIAL` e o front pede confirmação.
- DELETE com `?idFilial=` remove o **vínculo** daquela filial; sem `idFilial` soft-delete o cadastro.

## Entidade geral + específica

Quando o cadastro tem um núcleo comum e fichas diferentes (pessoa+papel, produto+moto/bicicleta):

- Tabela geral com `id` (gerado, imutável) e campos de todos.
- Tabela 1:1 por tipo (`produto_moto`, `produto_bicicleta`) com FK para o geral.
- Enum `tipo` no geral; **não** mudar o tipo depois de criado.
- Não criar tipo “reservado” para o futuro (ex.: peça). Quando surgir, nova tabela + valor no enum.
- Form: seção geral + seção específica conforme o tipo.

## Backend

Camadas fixas por módulo: `domain` → `dto` → `repository` (interface + Exposed + Tables) → `service` → `http` (Resources + Routing) → `*Module.kt` no Koin.

- Tabelas novas: migration Flyway `V{n}__descricao.sql` (**nunca** editar migration já aplicada).
- Exposed **não** cria tabela.
- IDs `BIGINT IDENTITY`. Soft delete via `status` (`ativo` / `inativo` / `deletado`).
- Nomes de tabela no singular, colunas snake_case.
- Rotas JWT + RBAC (`podeConsultar*` / `podeGerenciar*`). Permissão `{modulo}:{verbo}`.
- Mutação com `withAudit` (coloca o usuário no contexto para `audit_logs`).
- Insert composto (ex.: produto + `produto_filial` + `estoque_produto` zerado) entra no **mesmo** `suspendTransaction`. Se faltar saldo em algum estoque da filial, ou falhar o insert em `audit_logs`, a transação aborta — não fica produto sem estoque nem estoque sem log.
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

- Form em **2 colunas**: Identificação | Contato; depois Endereço e Documento em largura total compacta.
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
