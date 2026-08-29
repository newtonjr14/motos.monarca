# Padrões de CRUD — Monarca Bike (motos-web)

Documento de referência para novas telas de cadastro. Siga estes padrões para manter consistência sem repetir instruções a cada feature.

## Estrutura de tela

Cada cadastro usa **dois modos** no mesmo componente:

| Modo | Quando | UI |
|------|--------|-----|
| **Lista** | Padrão | Cabeçalho + busca + tabela + paginação |
| **Formulário** | Novo / Editar | Link “← Voltar para a lista” + card com campos |

- **Não** usar modal para formulário principal de cadastro.
- **Early return**: `if (formAberto) return <Formulario ... />`.
- Largura do form: `max-w-xl` (cadastros simples) ou `max-w-5xl` (formulários com muitos campos, ex.: pessoa).

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

## Lista (estilo Google Drive)

- Tabela com classes `drive-table w-full` (ver `src/index.css`).
- Cabeçalhos: `Th` / células: `Td` (componentes em `App.tsx`).
- Linhas clicáveis: `drive-row-clickable`; selecionada: `drive-row-selected`.
- Espaçamento generoso (`drive-th` / `drive-td`), hover suave, borda só entre linhas.
- Paginação: `TablePagination` + `slicePage` + `PAGE_SIZE` (10) de `@/format`.
- Busca local no front filtrando nome/campos principais; resetar `page` para 1 ao mudar busca.

## Cabeçalho da lista

Use `CatalogHeader`:

- Título (`text-xl`, font display)
- Subtítulo: `{count} cadastrados`
- Botão dourado: `Novo {singular}`

## Formulário

- Card: `rounded-lg p-5`, `background: var(--card)`, borda `--border`.
- Campos: componente `Field` (label, required `*`, error, hint).
- Seções longas: `Section` com título em caps dourado.
- Layout em 2 colunas em telas largas: classe `form-grid-2`.
- Botões no rodapé: **Cancelar** (`btn-ghost`) + **Salvar** (`btn-gold`).
- Normalização ao salvar/blur:
  - Nomes: `toTitleCase`
  - E-mail: `toEmailLower`
  - Documentos/CEP/telefone: `apenasDigitos` quando aplicável

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

## Tipos de documento (API)

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/documentos-tipos` | consultar pessoa |
| GET | `/documentos-tipos/{id}` | consultar pessoa |
| POST | `/documentos-tipos` | gerenciar pessoa |
| PUT | `/documentos-tipos/{id}` | gerenciar pessoa |
| DELETE | `/documentos-tipos/{id}` | gerenciar pessoa |

Campos: `idPais`, `tipoPessoa` (fisica/juridica), `codigo` (único por país), `nome`, `unico` (boolean).

## API client (`src/api.ts`)

- Funções: `listar*`, `criar*`, `atualizar*`, `excluir*`.
- Erros: `ApiError` com `status` e `body`.
- Chamadas autenticadas via Bearer; 401 dispara refresh/logout (exceto health).

## i18n

- Preferir chaves em `src/i18n/translations.ts` para labels globais (nav, common, login).
- Cadastros ainda em PT fixo podem migrar gradualmente para `t("...")`.

## Backend

- Tabelas novas: migration Flyway `V{n}__descricao.sql` (nunca alterar migrations já aplicadas).
- Rotas protegidas com JWT + RBAC (`podeConsultar*` / `podeGerenciar*`).
- Auditoria em POST/PUT/DELETE via `withAudit`.

## Checklist para novo CRUD

1. Migration SQL (se necessário)
2. Domain + repository + service + routing (Kotlin)
3. Funções em `api.ts`
4. Item no menu + `View` type + rota em `AppShell`
5. Página com lista + form + `useCrudReset`
6. Tabela `drive-table`
7. Teste de integração em `motos-api/src/test/kotlin/`
