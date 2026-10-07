import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import monarcaLogo from "@/imports/Monarca.png";
import { useAuth } from "@/auth/AuthContext";
import LoginPage, { LanguageSelector, ThemeToggle, UserMenu } from "@/components/AuthUi";
import CotacoesPage from "@/components/CotacoesPage";
import ContasPagarPage from "@/components/ContasPagarPage";
import ContasReceberPage from "@/components/ContasReceberPage";
import EntradaNotaPage from "@/components/EntradaNotaPage";
import FacturasPage from "@/components/FacturasPage";
import FinalizadoresPage from "@/components/FinalizadoresPage";
import CaixasPage from "@/components/CaixasPage";
import CaixaOperacaoPage from "@/components/CaixaOperacaoPage";
import VendasPage from "@/components/VendasPage";
import HistoricoVendasPage from "@/components/HistoricoVendasPage";
import RelatoriosPage from "@/components/RelatoriosPage";
import { CotacaoAlerta, CotacaoChip, CotacaoHojeProvider } from "@/components/CotacaoBanner";
import { FilialGate, FilialSwitcher } from "@/components/FilialUi";
import CidadeSearchSelect from "@/components/CidadeSearchSelect";
import DdiSearchSelect from "@/components/DdiSearchSelect";
import EmpresaPage from "@/components/EmpresaPage";
import EstoquesPage from "@/components/EstoquesPage";
import MarcasPage from "@/components/MarcasPage";
import ModelosPage from "@/components/ModelosPage";
import ProdutosPage from "@/components/ProdutosPage";
import PapelFicha from "@/components/PapelFicha";
import PessoaPreviewModal from "@/components/PessoaPreviewModal";
import { FormTabs, navegarGuiaNoTeclado } from "@/components/crud/Field";
import { ListToolbar, StatusBadge, StatusFilter, TableHeadRow, passaFiltroStatus, useAlternarStatus, useListSort, type FiltroStatus } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useSystemHeartbeat } from "@/hooks/useSystemHeartbeat";
import { useI18n } from "@/i18n";
import { conflitoSemVinculoNaFilial, isErroCampoDocumento, mensagemConflitoDocumento, mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { pessoaParaAtualizacao } from "@/papelUtils";
import type { SystemStatus } from "@/systemStatus";
import { APP_VERSION } from "@/version";
import {
  ApiError,
  atualizarCidade,
  atualizarDivisao,
  atualizarPais,
  atualizarPapel,
  criarCidade,
  criarDivisao,
  criarPais,
  criarPapel,
  excluirCidade,
  excluirDivisao,
  excluirPais,
  excluirPapel,
  buscarPapel,
  consultarPapelDocumento,
  listarCidades,
  listarDivisoes,
  listarPapeis,
  listarPaises,
  listarTipos,
  aquecerCacheTiposDocumento,
  tiposDocumentoEmCache,
  listarUsuarios,
  listarFiliais,
  listarCaixas,
  listarProdutos,
  listarVendas,
  criarTipoDocumento,
  atualizarTipoDocumento,
  excluirTipoDocumento,
  criarUsuario,
  atualizarUsuario,
  excluirUsuario,
  type Cidade,
  type Divisao,
  type DocumentoConflito,
  type DocumentoTipo,
  type Pais,
  type Papel,
  type Pessoa,
  type TipoEndereco,
  type TipoPessoa,
  type Usuario,
  type PerfilUsuario,
  type Filial,
  type Caixa,
  type VinculoFilialConflito,
  Permissao,
} from "@/api";
import { FilialProvider, useFilial, useFilialId } from "@/auth/FilialContext";
import {
  PAGE_SIZE,
  apenasDigitos,
  enderecoPrincipal,
  formatarCidade,
  rotuloCidade,
  formatarDocumentoEntrada,
  formatarDocumentoExibicao,
  formatPyg,
  normalizarCep,
  normalizarTipoLogradouroCodigo,
  placeholderDocumento,
  TIPOS_LOGRADOURO,
  toTitleCase,
  toEmailLower,
} from "@/format";
import type { TranslationKey } from "@/i18n";
const v = (name: string) => `var(${name})`;

function useTheme() {
  const [light, setLight] = useState(() => localStorage.getItem("monarca.theme") === "light");
  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    localStorage.setItem("monarca.theme", light ? "light" : "dark");
  }, [light]);
  return { light, toggle: () => setLight((x) => !x) };
}

function Badge({ children, color }: { children: React.ReactNode; color: "gold" | "green" | "sky" | "red" | "slate" }) {
  const palettes = {
    gold:  { bg: "rgba(228,180,18,0.12)", border: "rgba(228,180,18,0.3)", color: v("--gold") },
    green: { bg: "var(--success-bg)",       border: "var(--success-border)", color: "var(--success)" },
    sky:   { bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.2)", color: "#38bdf8" },
    red:   { bg: "var(--danger-bg)",       border: "var(--danger-border)", color: "var(--danger)" },
    slate: { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)", color: v("--text-muted") },
  };
  const p = palettes[color];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap"
      style={{ background: p.bg, borderColor: p.border, color: p.color }}>
      {children}
    </span>
  );
}

function Td({ children, mono, gold, sub, nowrap, clip, title }: {
  children: React.ReactNode; mono?: boolean; gold?: boolean; sub?: boolean;
  nowrap?: boolean; clip?: boolean; title?: string;
}) {
  return (
    <td
      className={`drive-td${mono ? " font-mono" : ""}${nowrap ? " drive-td-nowrap" : ""}${clip ? " drive-td-clip" : ""}`}
      title={title}
      style={{ color: gold ? v("--gold") : sub ? v("--text-muted") : v("--text-sub") }}
    >
      {children}
    </td>
  );
}

function TablePagination({ page, total, onPageChange }: { page: number; total: number; onPageChange: (p: number) => void }) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const to = Math.min(pageSafe * PAGE_SIZE, total);
  return (
    <div className="px-4 py-2.5 flex items-center justify-between gap-2" style={{ borderTop: `1px solid ${v("--border")}` }}>
      <p className="text-xs" style={{ color: v("--text-muted") }}>
        {t("common.showing")} {from}–{to} {t("common.of")} {total}
      </p>
      <div className="flex gap-1">
        <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pageSafe <= 1}
          onClick={() => onPageChange(Math.max(1, pageSafe - 1))}>{t("common.previous")}</button>
        <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={pageSafe >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, pageSafe + 1))}>{t("common.next")}</button>
      </div>
    </div>
  );
}

function Field({
  label, required, error, hint, className, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>
        {label}{required && <span style={{ color: v("--gold") }}> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error
        ? <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>
        : hint
          ? <p className="mt-1 text-xs" style={{ color: v("--text-muted") }}>{hint}</p>
          : null}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--gold") }}>{title}</p>
      {children}
    </div>
  );
}

const Icon = {
  dashboard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  clientes: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  fornecedores: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M3 9l2.5-5h13L21 9"/><path d="M12 12v5"/><path d="M8 12v5"/><path d="M16 12v5"/></svg>,
  paises: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 010 20"/><path d="M12 2a15.3 15.3 0 000 20"/></svg>,
  divisoes: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>,
  cidades: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>,
  usuarios: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  empresa: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M6 21V7l6-4 6 4v14"/><path d="M9 21v-6h6v6"/></svg>,
  produtos: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5"/><path d="M12 22V12"/></svg>,
  marcas: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  modelos: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  estoques: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  cotacoes: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  vendas: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
  historico: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  facturas: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>,
  entradaNota: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>,
  contas: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>,
  caixa: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><path d="M12 14h.01"/></svg>,
  relatorios: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-3"/></svg>,
  finalizadores: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  chevron: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  search: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  sun: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  phone: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.94 6.94l1.51-1.52a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  mail: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  pin: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  more: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
};

type View = "dashboard" | "vendas" | "historico" | "relatorioReceber" | "relatorioPagar" | "relatorioVendas" | "relatorioEstoque" | "caixa" | "contasReceber" | "contasPagar" | "entradaNota" | "facturas" | "clientes" | "fornecedores" | "produtos" | "marcas" | "modelos" | "estoques" | "cotacoes" | "finalizadores" | "caixas" | "usuarios" | "empresa" | "paises" | "divisoes" | "cidades" | "documentos";
type Recurso = "clientes" | "fornecedores";
type NavPermissao = string | readonly string[];
type NavItem = { id: View; label: string; icon: keyof typeof Icon; permissao: NavPermissao };
type NavGrupoId = "vendas" | "financeiro" | "relatorios" | "catalogo" | "pessoas" | "configuracao" | "localidade";

function navPermitido(permissao: NavPermissao, has: (codigo: string) => boolean) {
  return typeof permissao === "string" ? has(permissao) : permissao.some((codigo) => has(codigo));
}
type NavGrupo = { id: NavGrupoId; items: NavItem[] };

const NAV_GRUPOS_STORAGE_KEY = "monarca.nav.grupos";

function padraoAbertos(): Record<NavGrupoId, boolean> {
  return {
    vendas: false,
    financeiro: false,
    relatorios: false,
    catalogo: false,
    pessoas: false,
    configuracao: false,
    localidade: false,
  };
}

function lerAbertosSalvos(): Record<NavGrupoId, boolean> {
  const base = padraoAbertos();
  try {
    const raw = localStorage.getItem(NAV_GRUPOS_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Record<NavGrupoId, boolean>>;
    for (const id of Object.keys(base) as NavGrupoId[]) {
      if (typeof parsed[id] === "boolean") base[id] = parsed[id]!;
    }
  } catch {
    /* ignore */
  }
  return base;
}

function salvarAbertos(abertos: Record<NavGrupoId, boolean>) {
  try {
    localStorage.setItem(NAV_GRUPOS_STORAGE_KEY, JSON.stringify(abertos));
  } catch {
    /* ignore */
  }
}

const navDashboard: NavItem = {
  id: "dashboard", label: "Dashboard", icon: "dashboard", permissao: Permissao.DASHBOARD_CONSULTAR,
};

const navGrupos: NavGrupo[] = [
  {
    id: "vendas",
    items: [
      { id: "vendas", label: "Vendas", icon: "vendas", permissao: Permissao.VENDA_REGISTRAR },
      { id: "historico", label: "Histórico", icon: "historico", permissao: Permissao.VENDA_REGISTRAR },
      { id: "facturas", label: "Faturas", icon: "facturas", permissao: Permissao.VENDA_REGISTRAR },
    ],
  },
  {
    id: "financeiro",
    items: [
      { id: "caixa", label: "Caixa", icon: "caixa", permissao: Permissao.CAIXA_OPERAR },
      { id: "cotacoes", label: "Cotações", icon: "cotacoes", permissao: Permissao.COTACAO_GERENCIAR },
      { id: "contasReceber", label: "Contas a receber", icon: "contas", permissao: Permissao.FINANCEIRO_OPERAR },
      { id: "contasPagar", label: "Contas a pagar", icon: "contas", permissao: Permissao.FINANCEIRO_OPERAR },
      { id: "entradaNota", label: "Entrada de nota", icon: "entradaNota", permissao: Permissao.FINANCEIRO_OPERAR },
    ],
  },
  {
    id: "relatorios",
    items: [
      { id: "relatorioReceber", label: "Contas a receber", icon: "contas", permissao: Permissao.FINANCEIRO_OPERAR },
      { id: "relatorioPagar", label: "Contas a pagar", icon: "contas", permissao: Permissao.FINANCEIRO_OPERAR },
      { id: "relatorioVendas", label: "Vendas", icon: "vendas", permissao: Permissao.VENDA_REGISTRAR },
      { id: "relatorioEstoque", label: "Estoque", icon: "estoques", permissao: [Permissao.ESTOQUE_CONSULTAR, Permissao.ESTOQUE_GERENCIAR] },
    ],
  },
  {
    id: "catalogo",
    items: [
      { id: "produtos", label: "Produtos", icon: "produtos", permissao: Permissao.PRODUTO_GERENCIAR },
      { id: "marcas", label: "Marcas", icon: "marcas", permissao: Permissao.PRODUTO_GERENCIAR },
      { id: "modelos", label: "Modelos", icon: "modelos", permissao: Permissao.PRODUTO_GERENCIAR },
      { id: "estoques", label: "Estoques", icon: "estoques", permissao: Permissao.ESTOQUE_GERENCIAR },
    ],
  },
  {
    id: "pessoas",
    items: [
      { id: "clientes", label: "Clientes", icon: "clientes", permissao: Permissao.PESSOA_GERENCIAR },
      { id: "fornecedores", label: "Fornecedores", icon: "fornecedores", permissao: Permissao.PESSOA_GERENCIAR },
    ],
  },
  {
    id: "configuracao",
    items: [
      { id: "empresa", label: "Empresa", icon: "empresa", permissao: Permissao.CONFIGURACAO },
      { id: "usuarios", label: "Usuários", icon: "usuarios", permissao: Permissao.USUARIO_LISTAR },
      { id: "caixas", label: "Caixas", icon: "caixa", permissao: Permissao.CAIXA_GERENCIAR },
      { id: "finalizadores", label: "Finalizadores", icon: "finalizadores", permissao: Permissao.CAIXA_GERENCIAR },
    ],
  },
  {
    id: "localidade",
    items: [
      { id: "paises", label: "Países", icon: "paises", permissao: Permissao.LOCALIDADE_GERENCIAR },
      { id: "divisoes", label: "UFs / Departamentos", icon: "divisoes", permissao: Permissao.LOCALIDADE_GERENCIAR },
      { id: "cidades", label: "Cidades", icon: "cidades", permissao: Permissao.LOCALIDADE_GERENCIAR },
      { id: "documentos", label: "Tipos de documento", icon: "divisoes", permissao: Permissao.DOCUMENTO_GERENCIAR },
    ],
  },
];

const navTodas: NavItem[] = [navDashboard, ...navGrupos.flatMap((g) => g.items)];

function NavButton({ id, label, icon, active, onClick }: {
  id: View; label: string; icon: keyof typeof Icon; active: boolean; onClick: (v: View) => void;
}) {
  const IconComp = Icon[icon];
  return (
    <button key={id} onClick={() => onClick(id)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 text-sm transition-all duration-150 cursor-pointer"
      style={{
        background: active ? v("--gold-bg") : "transparent",
        color: active ? v("--gold") : v("--text-sub"),
        borderLeft: active ? `2px solid ${v("--gold")}` : "2px solid transparent",
      }}>
      <IconComp />{label}
    </button>
  );
}

function Sidebar({ view, onNavigate, systemStatus }: {
  view: View | null; onNavigate: (v: View) => void; systemStatus: SystemStatus;
}) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const [abertos, setAbertos] = useState<Record<NavGrupoId, boolean>>(lerAbertosSalvos);

  const dashboardOk = navPermitido(navDashboard.permissao, hasPermission)
    ? { ...navDashboard, label: t("nav.dashboard") }
    : null;

  const gruposVisiveis = navGrupos
    .map((g) => ({
      ...g,
      items: g.items
        .filter((item) => navPermitido(item.permissao, hasPermission))
        .map((item) => ({ ...item, label: t(`nav.${item.id}` as const) })),
    }))
    .filter((g) => g.items.length > 0);

  useEffect(() => {
    if (!view) return;
    const grupo = navGrupos.find((g) => g.items.some((i) => i.id === view));
    if (!grupo) return;
    setAbertos((atual) => {
      if (atual[grupo.id]) return atual;
      const proximo = { ...atual, [grupo.id]: true };
      salvarAbertos(proximo);
      return proximo;
    });
  }, [view]);

  function alternarGrupo(id: NavGrupoId) {
    setAbertos((atual) => {
      const proximo = { ...atual, [id]: !atual[id] };
      salvarAbertos(proximo);
      return proximo;
    });
  }

  return (
    <aside className="flex flex-col w-56 shrink-0 h-screen sticky top-0 overflow-y-auto"
      style={{ background: v("--bg-sidebar"), borderRight: `1px solid ${v("--border")}` }}>
      <div className="px-5 pt-5 pb-3 flex items-center justify-center">
        <img
          src={monarcaLogo}
          alt={t("app.name")}
          className="w-full object-contain"
          style={{ maxHeight: 92, filter: "drop-shadow(0 2px 10px rgba(228,180,18,0.28))" }}
        />
      </div>

      <div className="mx-4 mb-4" style={{ height: 1, background: v("--border") }} />

      <nav className="flex-1 px-3 pb-2">
        {dashboardOk && (
          <NavButton {...dashboardOk} active={view === "dashboard"} onClick={onNavigate} />
        )}
        {gruposVisiveis.map((grupo) => {
          const aberto = abertos[grupo.id] ?? false;
          const temAtivo = grupo.items.some((i) => i.id === view);
          return (
            <div key={grupo.id} className={dashboardOk || gruposVisiveis[0]?.id !== grupo.id ? "mt-3" : "mt-2"}>
              <button
                type="button"
                onClick={() => alternarGrupo(grupo.id)}
                className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer"
                style={{ color: temAtivo ? v("--gold") : v("--text-muted") }}
                aria-expanded={aberto}
              >
                <span className="text-[11px] font-medium tracking-widest uppercase text-left">
                  {t(`nav.group.${grupo.id}` as const)}
                </span>
                <span
                  className="shrink-0 transition-transform duration-150"
                  style={{ transform: aberto ? "rotate(0deg)" : "rotate(-90deg)", opacity: 0.7 }}
                >
                  <Icon.chevron />
                </span>
              </button>
              {aberto && grupo.items.map((item) => (
                <NavButton key={item.id} {...item} active={view === item.id} onClick={onNavigate} />
              ))}
            </div>
          );
        })}
      </nav>

      <div className="p-3 mx-3 mb-3 rounded-md" style={{ background: v("--card2"), border: `1px solid ${v("--border")}` }}>
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: systemStatus === "online" ? "#34d399" : systemStatus === "offline" ? "#ef4444" : v("--text-muted"),
            }}
          />
          <span className="text-xs" style={{ color: v("--text-muted") }}>
            {systemStatus === "online"
              ? t("system.online")
              : systemStatus === "offline"
                ? t("system.offline")
                : t("system.checking")}
          </span>
        </div>
        <p className="text-[10px] font-mono mt-2" style={{ color: v("--text-muted") }}>
          {t("app.name")} · v{APP_VERSION}
        </p>
      </div>
    </aside>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-5 rounded-lg" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
      <p className="text-xs font-medium mb-3" style={{ color: v("--text-muted") }}>{label}</p>
      <p className="text-2xl font-semibold leading-none mb-2" style={{ fontFamily: "var(--font-mono)", color: v("--text") }}>{value}</p>
      <p className="text-xs" style={{ color: v("--text-muted") }}>{sub}</p>
    </div>
  );
}

function Dashboard({
  clientes,
  fornecedores,
  systemOnline,
  onNavigate,
}: {
  clientes: Papel[];
  fornecedores: Papel[];
  systemOnline: boolean;
  onNavigate: (v: View) => void;
}) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const idFilial = useFilialId();
  const [vendasHoje, setVendasHoje] = useState(0);
  const [totalHoje, setTotalHoje] = useState(0);
  const [produtos, setProdutos] = useState(0);
  const [caixasAbertos, setCaixasAbertos] = useState(0);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!systemOnline || idFilial == null) return;
    let cancel = false;
    setCarregando(true);
    void (async () => {
      try {
        const tarefas: Promise<void>[] = [];
        if (hasPermission(Permissao.VENDA_REGISTRAR)) {
          tarefas.push(
            listarVendas(idFilial).then((vendas) => {
              if (cancel) return;
              const parts = new Intl.DateTimeFormat("en-CA", {
                timeZone: "America/Asuncion",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).formatToParts(new Date());
              const y = parts.find((p) => p.type === "year")?.value;
              const m = parts.find((p) => p.type === "month")?.value;
              const d = parts.find((p) => p.type === "day")?.value;
              const inicio = Date.parse(`${y}-${m}-${d}T04:00:00.000Z`);
              const doDia = vendas.filter((venda) => venda.criadoEm >= inicio);
              setVendasHoje(doDia.length);
              setTotalHoje(doDia.reduce((a, venda) => a + venda.totalPyg, 0));
            }),
          );
        }
        if (hasPermission(Permissao.PRODUTO_GERENCIAR)) {
          tarefas.push(
            listarProdutos(idFilial).then((lista) => {
              if (!cancel) setProdutos(lista.filter((p) => p.status === "ativo").length);
            }),
          );
        }
        if (hasPermission(Permissao.CAIXA_OPERAR) || hasPermission(Permissao.CAIXA_GERENCIAR)) {
          tarefas.push(
            listarCaixas(idFilial, true).then((lista) => {
              if (!cancel) setCaixasAbertos(lista.filter((c) => c.sessaoAbertaId).length);
            }),
          );
        }
        await Promise.all(tarefas);
      } catch {
        /* mantém últimos valores */
      } finally {
        if (!cancel) setCarregando(false);
      }
    })();
    return () => { cancel = true; };
  }, [systemOnline, idFilial, hasPermission]);

  const dash = (n: number | string) => (!systemOnline || carregando ? "—" : String(n));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("nav.dashboard")}</h1>
        <p className="text-sm mt-0.5" style={{ color: v("--text-muted") }}>{tf(t, "dashboard.subtitle", { app: t("app.name") })}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("dashboard.stat.vendasHoje")}
          value={dash(vendasHoje)}
          sub={systemOnline && !carregando ? `Gs. ${formatPyg(totalHoje)}` : t("dashboard.stat.vendasHojeSub")}
        />
        <StatCard label={t("dashboard.stat.clientes")} value={dash(clientes.length)} sub={t("dashboard.stat.clientesSub")} />
        <StatCard label={t("dashboard.stat.fornecedores")} value={dash(fornecedores.length)} sub={t("dashboard.stat.fornecedoresSub")} />
        <StatCard label={t("dashboard.stat.produtos")} value={dash(produtos)} sub={t("dashboard.stat.produtosSub")} />
        <StatCard label={t("dashboard.stat.caixas")} value={dash(caixasAbertos)} sub={t("dashboard.stat.caixasSub")} />
        <StatCard label={t("dashboard.stat.estoque")} value={dash(produtos)} sub={t("dashboard.stat.estoqueSub")} />
      </div>

      <div className="rounded-lg p-5 flex flex-wrap gap-2" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        {hasPermission(Permissao.VENDA_REGISTRAR) && (
          <button type="button" className="btn-gold px-4 py-2 text-sm" onClick={() => onNavigate("vendas")}>
            {t("dashboard.go.vendas")}
          </button>
        )}
        {(hasPermission(Permissao.CAIXA_OPERAR) || hasPermission(Permissao.CAIXA_GERENCIAR)) && (
          <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => onNavigate("caixa")}>
            {t("dashboard.go.caixa")}
          </button>
        )}
        {hasPermission(Permissao.VENDA_REGISTRAR) && (
          <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => onNavigate("historico")}>
            {t("dashboard.go.historico")}
          </button>
        )}
      </div>
    </div>
  );
}

function docPrincipal(p: Papel) {
  return p.pessoa.documentos[0];
}

const MENU_WIDTH = 176;
const MENU_EST_HEIGHT = 196;

function PapelRowMenu({
  item, recurso, open, onToggle, onClose, onView, onEdit, onChanged, onToggleStatus, statusBusy,
}: {
  item: Papel;
  recurso: Recurso;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onChanged: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
  statusBusy: boolean;
}) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open || !btnRef.current) {
      setMenuPos(null);
      return;
    }
    function updatePos() {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const openUp = spaceBelow < MENU_EST_HEIGHT && r.top > MENU_EST_HEIGHT;
      setMenuPos({
        top: openUp ? r.top - MENU_EST_HEIGHT - 4 : r.bottom + 4,
        left: Math.min(Math.max(8, r.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8),
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  async function alternarStatus() {
    const proximo = item.status === "ativo" ? "inativo" : "ativo";
    const msg = proximo === "inativo" ? t("ficha.confirmInactivate") : t("ficha.confirmActivate");
    if (!confirm(msg)) return;
    onClose();
    await onToggleStatus();
  }

  async function excluir() {
    if (!confirm(t("ficha.confirmDeleteBranch"))) return;
    setBusy(true);
    onClose();
    try {
      await excluirPapel(recurso, item.id, idFilial);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <td className="drive-td drive-td-actions" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className="btn-row-menu"
        disabled={busy || statusBusy}
        aria-label={t("papel.actionsMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <Icon.more />
      </button>
      {open && menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-[150]" onClick={onClose} aria-hidden />
          <div
            role="menu"
            className="menu-popover fixed z-[151] w-44 rounded-lg py-1 shadow-xl"
            style={{ top: menuPos.top, left: menuPos.left, background: v("--card"), border: `1px solid ${v("--border")}` }}
          >
            <button type="button" role="menuitem" className="menu-item" onClick={() => { onView(); onClose(); }}>{t("papel.viewSheet")}</button>
            <button type="button" role="menuitem" className="menu-item" onClick={() => { onEdit(); onClose(); }}>{t("common.edit")}</button>
            <div className="menu-divider" />
            <button type="button" role="menuitem" className="menu-item" onClick={() => void alternarStatus()}>
              {item.status === "ativo" ? t("ficha.inactivate") : t("ficha.activate")}
            </button>
            <button type="button" role="menuitem" className="menu-item menu-item-danger" onClick={() => void excluir()}>
              {t("common.delete")}
            </button>
          </div>
        </>,
        document.body,
      )}
    </td>
  );
}

function slicePage<T>(itens: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(itens.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  return {
    pageSafe,
    total: itens.length,
    slice: itens.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
  };
}

function PapelPage({ recurso, titulo, singular, cidades, paises, navReset, onNavigate }: {
  recurso: Recurso; titulo: string; singular: string; cidades: Cidade[]; paises: Pais[];
  navReset: number; onNavigate: (v: View) => void;
}) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<Papel[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Papel | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);

  useEffect(() => {
    for (const pais of paises) {
      if (pais.sigla !== "BR" && pais.sigla !== "PY") continue;
      void listarTipos(pais.id, "fisica");
      void listarTipos(pais.id, "juridica");
    }
  }, [paises]);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
    setSelected(null);
    setMenuId(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      setItens(await listarPapeis(recurso, idFilial));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }

  const filtered = itens.filter((p) => {
    if (!passaFiltroStatus(p.status, filtroStatus)) return false;
    const q = search.toLowerCase();
    const doc = docPrincipal(p);
    const cidade = formatarCidade(cidades, enderecoPrincipal(p.pessoa)?.idCidade ?? null, true);
    return `${p.pessoa.nomeRazaoSocial} ${p.pessoa.email ?? ""} ${p.pessoa.telefone ?? ""} ${doc?.numero ?? ""} ${doc?.tipoNome ?? ""} ${cidade}`.toLowerCase().includes(q);
  });

  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (p, k) => {
    if (k === "nome") return p.pessoa.nomeRazaoSocial;
    if (k === "documento") return docPrincipal(p)?.numero ?? "";
    if (k === "cidade") return formatarCidade(cidades, enderecoPrincipal(p.pessoa)?.idCidade ?? null, true);
    return p.id;
  });

  useEffect(() => { void carregar(); }, [recurso, idFilial]);
  useEffect(() => { setPage(1); }, [search, filtroStatus, recurso, sortKey, sortDir]);
  useEffect(() => {
    if (selected != null && !ordenados.some((p) => p.id === selected)) {
      setSelected(null);
    }
  }, [ordenados, selected]);

  const navIds = useMemo(() => ordenados.map((p) => p.id), [ordenados]);
  const navIndex = selected != null ? navIds.indexOf(selected) : -1;

  function navegarPara(index: number) {
    const id = navIds[index];
    if (id == null) return;
    setSelected(id);
    setPage(Math.floor(index / PAGE_SIZE) + 1);
  }

  const paged = slicePage(ordenados, page);
  const selecionado = ordenados.find((p) => p.id === selected) ?? null;

  async function alternarStatusPapel(item: Papel) {
    if (statusBusyId != null) return;
    const proximo = item.status === "ativo" ? "inativo" : "ativo";
    setErro(null);
    setStatusBusyId(item.id);
    setItens((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: proximo } : x)));
    try {
      await atualizarPapel(recurso, item.id, {
        status: proximo,
        pessoa: pessoaParaAtualizacao(item.pessoa),
      });
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
      await carregar();
    } finally {
      setStatusBusyId(null);
    }
  }

  if (formAberto) {
    return (
      <PapelForm
        key={editando?.id ?? "novo"}
        recurso={recurso}
        singular={singular}
        cidades={cidades}
        paises={paises}
        editando={editando}
        onClose={() => setFormAberto(false)}
        onSaved={async () => { setFormAberto(false); await carregar(); }}
        onAbrirExistente={(papel) => { setEditando(papel); }}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{titulo}</h1>
        <button className="btn-gold px-4 py-2 text-sm"
          onClick={() => { setEditando(null); setFormAberto(true); }}>
          {t("common.new")} {singular}
        </button>
      </div>

      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

      <ListToolbar>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: v("--text-muted") }}><Icon.search /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("papel.searchPlaceholder")}
            className="pl-8 pr-3 py-2 text-sm rounded-md outline-none w-64"
            style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
        </div>
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>

      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
          <table className="drive-table drive-table-papel w-full">
            <colgroup>
              <col style={{ width: "5.5rem" }} />
              <col />
              <col style={{ width: "11.5rem" }} />
              <col />
              <col style={{ width: "3.25rem" }} />
              <col style={{ width: "2.25rem" }} />
            </colgroup>
            <thead>
              <TableHeadRow
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
                cols={[
                  { label: "col.code", sort: "id" },
                  { label: "common.name", sort: "nome" },
                  { label: "col.document", sort: "documento" },
                  { label: "col.city", sort: "cidade" },
                  { label: "common.status" },
                  { label: "col.actions" },
                ]}
              />
            </thead>
            <tbody>
              {paged.slice.map((p) => {
                const doc = docPrincipal(p);
                const sel = selected === p.id;
                const cidade = formatarCidade(cidades, enderecoPrincipal(p.pessoa)?.idCidade ?? null, true);
                const docNum = doc ? formatarDocumentoExibicao(doc.tipoCodigo, doc.numero) : "—";
                const docTitle = doc ? `${doc.tipoNome} ${docNum}` : undefined;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(sel ? null : p.id)}
                    className={`drive-row-clickable${sel ? " drive-row-selected" : ""}`}
                  >
                    <Td mono gold>{p.id}</Td>
                    <td className="drive-td drive-td-clip text-[0.8125rem] font-medium" style={{ color: v("--text") }} title={p.pessoa.nomeRazaoSocial}>{p.pessoa.nomeRazaoSocial}</td>
                    <Td mono sub clip title={docTitle}>{docNum}</Td>
                    <Td sub clip title={cidade !== "—" ? cidade : undefined}>{cidade}</Td>
                    <td className="drive-td drive-td-status" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge
                        status={p.status === "inativo" ? "inativo" : "ativo"}
                        disabled={statusBusyId === p.id}
                        onToggle={() => void alternarStatusPapel(p)}
                      />
                    </td>
                    <PapelRowMenu
                      item={p}
                      recurso={recurso}
                      open={menuId === p.id}
                      onToggle={() => setMenuId(menuId === p.id ? null : p.id)}
                      onClose={() => setMenuId(null)}
                      onView={() => setSelected(p.id)}
                      onEdit={() => { setEditando(p); setFormAberto(true); }}
                      onChanged={carregar}
                      statusBusy={statusBusyId === p.id}
                      onToggleStatus={() => alternarStatusPapel(p)}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
          {filtered.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>

      {selecionado && (
        <PapelFicha
          item={selecionado}
          recurso={recurso}
          singular={singular}
          cidades={cidades}
          nav={navIndex >= 0 ? {
            index: navIndex,
            total: navIds.length,
            onPrev: () => navegarPara(navIndex - 1),
            onNext: () => navegarPara(navIndex + 1),
          } : undefined}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditando(selecionado); setSelected(null); setFormAberto(true); }}
          onChanged={carregar}
        />
      )}
    </div>
  );
}

type EnderecoForm = {
  tipo: TipoEndereco;
  principal: boolean;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  complemento: string;
  idCidade: number | "";
};

function enderecoVazio(principal = true): EnderecoForm {
  return {
    tipo: "residencial",
    principal,
    tipoLogradouro: "rua",
    logradouro: "",
    numero: "",
    bairro: "",
    cep: "",
    complemento: "",
    idCidade: "",
  };
}

function enderecosIniciais(pessoa?: Pessoa): EnderecoForm[] {
  const ativos = (pessoa?.enderecos ?? []).filter((e) => e.status !== "deletado");
  if (!ativos.length) return [enderecoVazio(true)];
  const mapped: EnderecoForm[] = ativos.map((e) => ({
    tipo: e.tipo,
    principal: e.principal,
    tipoLogradouro: normalizarTipoLogradouroCodigo(e.tipoLogradouro),
    logradouro: e.logradouro ?? "",
    numero: e.numero ?? "",
    bairro: e.bairro ?? "",
    cep: e.cep ?? "",
    complemento: e.complemento ?? "",
    idCidade: e.idCidade == null ? "" : e.idCidade,
  }));
  if (!mapped.some((e) => e.principal)) mapped[0]!.principal = true;
  return mapped;
}

function enderecoPreenchido(e: EnderecoForm): boolean {
  return Boolean(
    e.tipoLogradouro.trim() ||
    e.logradouro.trim() ||
    e.numero.trim() ||
    e.bairro.trim() ||
    e.cep.trim() ||
    e.complemento.trim() ||
    e.idCidade !== "",
  );
}

function preferirTipoDocumento(lista: DocumentoTipo[], tipoPessoa: TipoPessoa, paisSigla?: string): DocumentoTipo | undefined {
  const sigla = paisSigla?.toUpperCase();
  const preferidos =
    sigla === "BR"
      ? tipoPessoa === "juridica" ? ["CNPJ", "CPF"] : ["CPF", "CNPJ"]
      : sigla === "PY"
        ? tipoPessoa === "juridica" ? ["RUC", "CI"] : ["CI", "RUC"]
        : [];
  for (const codigo of preferidos) {
    const hit = lista.find((tp) => tp.codigo.toUpperCase() === codigo);
    if (hit) return hit;
  }
  return lista[0];
}

function codigoDocumentoPreferido(paisSigla: string | undefined, tipoPessoa: TipoPessoa): string | undefined {
  const sigla = paisSigla?.toUpperCase();
  if (sigla === "BR") return tipoPessoa === "juridica" ? "CNPJ" : "CPF";
  if (sigla === "PY") return tipoPessoa === "juridica" ? "RUC" : "CI";
  return undefined;
}

function PapelForm({ recurso, singular, cidades, paises, editando, onClose, onSaved, onAbrirExistente, onNavigate }: {
  recurso: Recurso; singular: string; cidades: Cidade[]; paises: Pais[]; editando: Papel | null;
  onClose: () => void; onSaved: () => Promise<void>; onAbrirExistente: (papel: Papel) => void; onNavigate: (v: View) => void;
}) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const idFilialCadastro = useFilialId();
  const numeroRef = useRef<HTMLInputElement>(null);
  const conflitoRef = useRef<HTMLDivElement>(null);
  const pessoa = editando?.pessoa;
  const doc0 = pessoa?.documentos[0];
  const tipoPessoaInicial: TipoPessoa = pessoa?.tipoPessoa ?? "fisica";
  const paisPadrao = paises.find((p) => p.sigla === "BR") ?? paises[0];
  const idPaisInicial = doc0?.idPais ?? paisPadrao?.id;
  const tiposIniciais =
    idPaisInicial == null ? [] : (tiposDocumentoEmCache(idPaisInicial, tipoPessoaInicial) ?? []);
  const tipoInicialPreferido =
    doc0?.idTipoDocumento != null && tiposIniciais.some((tp) => tp.id === doc0.idTipoDocumento)
      ? tiposIniciais.find((tp) => tp.id === doc0.idTipoDocumento)
      : preferirTipoDocumento(
          tiposIniciais,
          tipoPessoaInicial,
          (idPaisInicial != null ? paises.find((p) => p.id === idPaisInicial) : undefined)?.sigla
            ?? paisPadrao?.sigla,
        );

  const [tipos, setTipos] = useState<DocumentoTipo[]>(tiposIniciais);
  const [nome, setNome] = useState(pessoa?.nomeRazaoSocial ?? "");
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(tipoPessoaInicial);
  const [ddi, setDdi] = useState(pessoa?.ddi ?? "");
  const [telefone, setTelefone] = useState(pessoa?.telefone ?? "");
  const [ddi2, setDdi2] = useState(pessoa?.ddi2 ?? "");
  const [telefone2, setTelefone2] = useState(pessoa?.telefone2 ?? "");
  const [email, setEmail] = useState(pessoa?.email ?? "");
  const [enderecos, setEnderecos] = useState<EnderecoForm[]>(() => enderecosIniciais(pessoa));
  const [status, setStatus] = useState<"ativo" | "inativo">(editando?.status === "inativo" ? "inativo" : "ativo");
  const [idPais, setIdPais] = useState<number | "">(idPaisInicial ?? "");
  const [idTipo, setIdTipo] = useState<number | "">(doc0?.idTipoDocumento ?? tipoInicialPreferido?.id ?? "");
  const [numero, setNumero] = useState(() =>
    formatarDocumentoExibicao(doc0?.tipoCodigo ?? tipoInicialPreferido?.codigo ?? null, doc0?.numero ?? ""),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [erroNumero, setErroNumero] = useState<string | null>(null);
  const [conflito, setConflito] = useState<DocumentoConflito | VinculoFilialConflito | null>(null);
  const [idPessoaPendente, setIdPessoaPendente] = useState<number | null>(null);
  const [previewPessoaId, setPreviewPessoaId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [guia, setGuia] = useState<"dados" | "enderecos">("dados");

  useEffect(() => {
    if (idPais !== "" || !paisPadrao) return;
    setIdPais(paisPadrao.id);
  }, [idPais, paisPadrao]);

  useEffect(() => {
    if (idPais === "") {
      setTipos([]);
      return;
    }
    const cached = tiposDocumentoEmCache(Number(idPais), tipoPessoa);
    if (cached) {
      setTipos(cached);
      const pais = paises.find((p) => p.id === Number(idPais));
      setIdTipo((atual) => {
        if (atual !== "" && cached.some((tp) => tp.id === atual)) return atual;
        const next = preferirTipoDocumento(cached, tipoPessoa, pais?.sigla);
        setNumero((valor) => formatarDocumentoEntrada(next?.codigo, valor));
        return next?.id ?? "";
      });
    }
    let cancel = false;
    void (async () => {
      const listaTipos = await listarTipos(Number(idPais), tipoPessoa);
      if (cancel) return;
      setTipos(listaTipos);
      const pais = paises.find((p) => p.id === Number(idPais));
      setIdTipo((atual) => {
        if (atual !== "" && listaTipos.some((tp) => tp.id === atual)) return atual;
        const next = preferirTipoDocumento(listaTipos, tipoPessoa, pais?.sigla);
        setNumero((valor) => formatarDocumentoEntrada(next?.codigo, valor));
        return next?.id ?? "";
      });
    })();
    return () => { cancel = true; };
  }, [tipoPessoa, idPais, paises]);

  const tipoSelecionado = tipos.find((t) => t.id === idTipo);
  const paisSelecionado = idPais === "" ? undefined : paises.find((p) => p.id === Number(idPais));
  const codigoMascara =
    tipoSelecionado?.codigo
    ?? codigoDocumentoPreferido(paisSelecionado?.sigla ?? paisPadrao?.sigla ?? "BR", tipoPessoa)
    ?? "CPF";
  const rotuloTipoProvisorio = codigoMascara;
  const consultaDocSeq = useRef(0);

  useEffect(() => {
    if (!conflito) return;
    conflitoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conflito]);

  function patchEndereco(index: number, patch: Partial<EnderecoForm>) {
    setEnderecos((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function marcarPrincipal(index: number) {
    setEnderecos((prev) => prev.map((e, i) => ({ ...e, principal: i === index })));
  }

  function adicionarEndereco() {
    setEnderecos((prev) => [...prev, enderecoVazio(prev.length === 0)]);
  }

  function removerEndereco(index: number) {
    setEnderecos((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((e) => e.principal) && next[0]) next[0] = { ...next[0], principal: true };
      return next;
    });
  }

  function corpoPessoa() {
    const ddiDigits = apenasDigitos(ddi);
    const telDigits = apenasDigitos(telefone);
    const ddi2Digits = apenasDigitos(ddi2);
    const tel2Digits = apenasDigitos(telefone2);
    return {
      nomeRazaoSocial: toTitleCase(nome),
      tipoPessoa,
      ddi: ddiDigits || null,
      telefone: telDigits || null,
      ddi2: ddi2Digits || null,
      telefone2: tel2Digits || null,
      email: toEmailLower(email) || null,
      enderecos: enderecos.filter(enderecoPreenchido).map((e, i, lista) => ({
        tipo: e.tipo,
        principal: lista.length === 1 ? true : e.principal,
        tipoLogradouro: normalizarTipoLogradouroCodigo(e.tipoLogradouro),
        logradouro: toTitleCase(e.logradouro) || null,
        numero: e.numero.trim() || null,
        bairro: toTitleCase(e.bairro) || null,
        cep: normalizarCep(e.cep) || null,
        complemento: toTitleCase(e.complemento) || null,
        idCidade: e.idCidade === "" ? null : Number(e.idCidade),
      })),
      status: "ativo" as const,
      documentos: [{
        idPais: Number(idPais),
        idTipoDocumento: idTipo === "" ? null : Number(idTipo),
        numero,
      }],
    };
  }

  function validarLocal(): boolean {
    if (!nome.trim()) {
      setErro(t("papel.error.nameRequired"));
      setGuia("dados");
      return false;
    }
    const ddiDigits = apenasDigitos(ddi);
    const telDigits = apenasDigitos(telefone);
    if (Boolean(ddiDigits) !== Boolean(telDigits)) {
      setErro(t("papel.error.phonePair"));
      setGuia("dados");
      return false;
    }
    const ddi2Digits = apenasDigitos(ddi2);
    const tel2Digits = apenasDigitos(telefone2);
    if (Boolean(ddi2Digits) !== Boolean(tel2Digits)) {
      setErro(t("papel.error.phone2Pair"));
      setGuia("dados");
      return false;
    }
    if (idPais === "" || idTipo === "") {
      setErro(t("papel.error.docRequired"));
      setGuia("dados");
      return false;
    }
    if (!numero.trim()) {
      setErroNumero(t("papel.error.docNumberRequired"));
      setGuia("dados");
      return false;
    }
    return true;
  }

  async function salvar(idPessoaExistente?: number, confirmarVinculoFilial = false) {
    setErro(null);
    setErroNumero(null);
    if (idPessoaExistente == null && !validarLocal()) return;
    setSalvando(true);
    try {
      if (editando) {
        await atualizarPapel(recurso, editando.id, { status, pessoa: corpoPessoa() });
        // Abrir cadastro + Salvar não recriava o vínculo após exclusão da filial
        const jaNaFilial = (editando.filiaisVinculadas ?? []).some((f) => f.id === idFilialCadastro);
        if (!jaNaFilial) {
          await criarPapel(recurso, {
            idPessoa: editando.idPessoa,
            idFilialCadastro,
            confirmarVinculoFilial,
            status,
          });
        }
      } else if (idPessoaExistente != null) {
        await criarPapel(recurso, {
          idPessoa: idPessoaExistente,
          idFilialCadastro,
          confirmarVinculoFilial,
          status,
        });
      } else {
        await criarPapel(recurso, { status, idFilialCadastro, pessoa: corpoPessoa() });
      }
      setConflito(null);
      setIdPessoaPendente(null);
      await onSaved();
    } catch (e) {
      const msg = mensagemErroApi(e, t, "papel.error.saveFailed");
      if (e instanceof ApiError && e.status === 409) {
        const body = e.body as DocumentoConflito | VinculoFilialConflito;
        setConflito(body);
        setGuia("dados");
        if (body.codigo === "VINCULO_FILIAL") {
          setIdPessoaPendente(body.pessoa.id);
        } else if (idPessoaExistente != null) {
          setIdPessoaPendente(idPessoaExistente);
        } else if (editando) {
          setIdPessoaPendente(editando.idPessoa);
        }
      } else if (isErroCampoDocumento(e)) {
        setErroNumero(msg);
        setGuia("dados");
      } else {
        setErro(msg);
        const codigo = e instanceof ApiError ? (e.body as { codigo?: string })?.codigo : undefined;
        if (codigo?.startsWith("ENDERECO_")) setGuia("enderecos");
      }
    } finally {
      setSalvando(false);
    }
  }

  function filiaisConflitoTexto(filiais: { nome: string }[] | undefined) {
    return (filiais ?? []).map((f) => f.nome).join(", ");
  }

  async function consultarDocumentoExistente(valor = numero) {
    if (idPais === "" || idTipo === "" || !valor.trim()) {
      setConflito(null);
      return;
    }
    const seq = ++consultaDocSeq.current;
    try {
      await consultarPapelDocumento(recurso, {
        idPais: Number(idPais),
        idTipoDocumento: Number(idTipo),
        numero: valor,
        tipoPessoa,
        ignorarPessoaId: editando?.pessoa.id,
      });
      if (seq !== consultaDocSeq.current) return;
      setConflito(null);
      setErroNumero(null);
    } catch (e) {
      if (seq !== consultaDocSeq.current) return;
      if (e instanceof ApiError && e.status === 409) {
        const body = e.body as DocumentoConflito | VinculoFilialConflito;
        setConflito(body);
        setErroNumero(null);
        setGuia("dados");
        if (body.codigo === "VINCULO_FILIAL") setIdPessoaPendente(body.pessoa.id);
      } else if (isErroCampoDocumento(e)) {
        setErroNumero(mensagemErroApi(e, t, "papel.error.saveFailed"));
        setConflito(null);
      }
    }
  }

  async function abrirCadastroExistente(idPapel: number) {
    setErro(null);
    setSalvando(true);
    try {
      onAbrirExistente(await buscarPapel(recurso, idPapel));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "papel.loadExistingFailed"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={onClose}>
        ← {t("common.back")}
      </button>
      <div>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? `${t("papel.edit")} ${singular.toLowerCase()}` : `${t("papel.new")} ${singular.toLowerCase()}`}
        </h1>
      </div>

      <form className="rounded-lg p-5 space-y-5" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
        onSubmit={(e) => { e.preventDefault(); void salvar(); }}
        onKeyDown={(e) => navegarGuiaNoTeclado(e, ["dados", "enderecos"], guia, setGuia)}>

        <FormTabs
          value={guia}
          onChange={setGuia}
          tabs={[
            { id: "dados", label: t("form.tab.data") },
            { id: "enderecos", label: t("form.tab.address") },
          ]}
        />

        <div role="tabpanel" id="form-panel-dados" aria-labelledby="form-tab-dados" hidden={guia !== "dados"}>
          <Section title={t("papel.section.document")}>
            {hasPermission(Permissao.DOCUMENTO_GERENCIAR) && (
              <div className="flex items-center justify-end gap-2 mb-1">
                <button type="button" className="text-xs cursor-pointer underline-offset-2 hover:underline transition-opacity hover:opacity-90"
                  style={{ color: v("--gold") }}
                  onClick={() => onNavigate("documentos")}>
                  {t("papel.manageDocTypes")}
                </button>
              </div>
            )}
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <Field label={t("papel.country")}>
                <select
                  className="field"
                  value={idPais}
                  onChange={(e) => setIdPais(Number(e.target.value))}
                  disabled={paises.length === 0}
                >
                  {paises.length === 0 && <option value="">Brasil</option>}
                  {paises.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </Field>
              <Field label={t("papel.docType")}>
                <select
                  className="field"
                  value={idTipo}
                  disabled={tipos.length === 0}
                  onChange={(e) => {
                    const nextId = Number(e.target.value);
                    setIdTipo(nextId);
                    setErroNumero(null);
                    const next = tipos.find((tp) => tp.id === nextId);
                    setNumero((atual) => formatarDocumentoEntrada(next?.codigo ?? codigoMascara, atual));
                  }}
                >
                  {tipos.length === 0 && <option value="">{rotuloTipoProvisorio}</option>}
                  {tipos.map((tp) => <option key={tp.id} value={tp.id}>{tp.nome}</option>)}
                </select>
              </Field>
              <Field label={t("papel.docNumber")} required error={erroNumero ?? undefined}>
                <input
                  ref={numeroRef}
                  className="field font-mono"
                  autoFocus={!editando}
                  value={numero}
                  onChange={(e) => {
                    setNumero(formatarDocumentoEntrada(codigoMascara, e.target.value));
                    setErroNumero(null);
                    setConflito(null);
                  }}
                  onBlur={(e) => void consultarDocumentoExistente(e.currentTarget.value)}
                  placeholder={placeholderDocumento(codigoMascara)}
                />
              </Field>
            </div>
          </Section>

          {conflito && (
            <div ref={conflitoRef} className="mt-3 p-3 rounded-md space-y-3" style={{ background: v("--gold-bg"), border: `1px solid ${v("--gold-border")}` }}>
              <p className="text-sm" style={{ color: v("--text") }}>
                {conflito.codigo === "VINCULO_FILIAL"
                  ? tf(t, "papel.conflict.linkBranch", {
                      nome: conflito.pessoa.nomeRazaoSocial,
                      filiais: filiaisConflitoTexto(conflito.filiaisVinculadas),
                      filialAlvo: "filialAlvoNome" in conflito ? conflito.filialAlvoNome : "",
                    })
                  : mensagemConflitoDocumento(conflito, t, { idFilial: idFilialCadastro })}
              </p>
              {conflito.filiaisVinculadas && conflito.filiaisVinculadas.length > 0 && conflito.codigo !== "VINCULO_FILIAL" && (
                <p className="text-xs" style={{ color: v("--text-muted") }}>
                  {t("papel.registeredBranches")}: {filiaisConflitoTexto(conflito.filiaisVinculadas)}
                </p>
              )}
              <p className="text-sm font-medium" style={{ color: v("--text-sub") }}>{conflito.pessoa.nomeRazaoSocial}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-ghost text-sm px-3 py-1.5"
                  onClick={() => setPreviewPessoaId(conflito.pessoa.id)}>
                  {t("papel.viewExisting")}
                </button>
                {conflito.codigo === "VINCULO_FILIAL" ? (
                  <button type="button" className="btn-gold text-sm px-3 py-1.5"
                    onClick={() => void salvar(idPessoaPendente ?? conflito.pessoa.id, true)}>
                    {t("papel.confirmLinkBranch")}
                  </button>
                ) : conflitoSemVinculoNaFilial(conflito, idFilialCadastro) ? (
                  <>
                    <button type="button" className="btn-gold text-sm px-3 py-1.5"
                      onClick={() => void salvar(conflito.pessoa.id)}>
                      {t("papel.linkToBranch")}
                    </button>
                    {conflito.idPapel != null && (
                      <button type="button" className="btn-ghost text-sm px-3 py-1.5"
                        onClick={() => void abrirCadastroExistente(conflito.idPapel!)}>
                        {t("papel.openExisting")}
                      </button>
                    )}
                  </>
                ) : conflito.idPapel != null ? (
                  <button type="button" className="btn-gold text-sm px-3 py-1.5"
                    onClick={() => void abrirCadastroExistente(conflito.idPapel!)}>
                    {t("papel.openExisting")}
                  </button>
                ) : (
                  <button type="button" className="btn-gold text-sm px-3 py-1.5"
                    onClick={() => void salvar(conflito.pessoa.id)}>
                    {t("papel.useExisting")}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="form-grid-2 mt-5">
            <Section title={t("papel.section.identification")}>
              <Field label={t("papel.name")} required>
                <input className="field" autoFocus={Boolean(editando)} value={nome}
                  onChange={(e) => { setNome(e.target.value); setErro(null); }}
                  onBlur={() => setNome((x) => toTitleCase(x))}
                  placeholder={t("papel.namePlaceholder")} />
              </Field>
              <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: editando ? "1fr 1fr" : "1fr" }}>
                <Field label={t("papel.personType")}>
                  <select className="field" value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value as TipoPessoa)}>
                    <option value="fisica">{t("papel.personType.fisica")}</option>
                    <option value="juridica">{t("papel.personType.juridica")}</option>
                  </select>
                </Field>
                {editando && (
                  <Field label={t("common.status")}>
                    <select className="field" value={status} onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}>
                      <option value="ativo">{t("common.active")}</option>
                      <option value="inativo">{t("common.inactive")}</option>
                    </select>
                  </Field>
                )}
              </div>
            </Section>

            <Section title={t("papel.section.contact")}>
              <DdiSearchSelect ddi={ddi} telefone={telefone}
                onChange={({ ddi: nextDdi, telefone: nextTel }) => { setDdi(nextDdi); setTelefone(nextTel); }} />
              <div className="mt-3">
                <DdiSearchSelect
                  ddi={ddi2}
                  telefone={telefone2}
                  phoneLabel={t("ddi.phone2")}
                  fallbackDdi={ddi}
                  onChange={({ ddi: nextDdi, telefone: nextTel }) => { setDdi2(nextDdi); setTelefone2(nextTel); }}
                />
              </div>
              <Field label={t("common.email")} className="mt-3">
                <input className="field" type="email" value={email}
                  onChange={(e) => setEmail(toEmailLower(e.target.value))}
                  onBlur={() => setEmail((x) => toEmailLower(x))}
                  placeholder="email@exemplo.com" />
              </Field>
            </Section>
          </div>
        </div>

        <div role="tabpanel" id="form-panel-enderecos" aria-labelledby="form-tab-enderecos" hidden={guia !== "enderecos"} className="space-y-5">
          {enderecos.map((e, i) => (
            <Section
              key={i}
              title={enderecos.length > 1 ? `${t("papel.section.address")} ${i + 1}` : t("papel.section.address")}
            >
              <div className="form-grid-2">
                <Field label={t("papel.addressType")}>
                  <select
                    className="field"
                    value={e.tipo}
                    onChange={(ev) => patchEndereco(i, { tipo: ev.target.value as TipoEndereco })}
                  >
                    <option value="fiscal">{t("papel.addressType.fiscal")}</option>
                    <option value="residencial">{t("papel.addressType.residencial")}</option>
                    <option value="entrega">{t("papel.addressType.entrega")}</option>
                  </select>
                </Field>
                <div className="flex items-end justify-between gap-3">
                  <label className="flex items-center gap-2 text-[13px] pb-2.5 cursor-pointer" style={{ color: v("--text-sub") }}>
                    <input
                      type="checkbox"
                      checked={e.principal}
                      onChange={() => { if (!e.principal) marcarPrincipal(i); }}
                    />
                    {t("papel.addressPrincipal")}
                  </label>
                  {enderecos.length > 1 && (
                    <button
                      type="button"
                      className="text-xs cursor-pointer pb-2.5"
                      style={{ color: v("--text-muted") }}
                      onClick={() => removerEndereco(i)}
                    >
                      {t("papel.addressRemove")}
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "11rem 1fr 5rem" }}>
                <Field label={t("papel.streetType")} required>
                  <select
                    className="field"
                    value={normalizarTipoLogradouroCodigo(e.tipoLogradouro)}
                    onChange={(ev) => patchEndereco(i, { tipoLogradouro: ev.target.value })}
                  >
                    {TIPOS_LOGRADOURO.map((codigo) => (
                      <option key={codigo} value={codigo}>
                        {t(`streetType.${codigo}` as TranslationKey)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("papel.street")}>
                  <input className="field" value={e.logradouro}
                    onChange={(ev) => patchEndereco(i, { logradouro: ev.target.value })}
                    onBlur={() => patchEndereco(i, { logradouro: toTitleCase(e.logradouro) })}
                    placeholder={t("papel.streetPlaceholder")} />
                </Field>
                <Field label={t("papel.number")}>
                  <input className="field" value={e.numero}
                    onChange={(ev) => patchEndereco(i, { numero: ev.target.value })}
                    placeholder={t("papel.numberPlaceholder")} />
                </Field>
              </div>
              <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "1fr 9rem 1fr" }}>
                <Field label={t("papel.neighborhood")}>
                  <input className="field" value={e.bairro}
                    onChange={(ev) => patchEndereco(i, { bairro: ev.target.value })}
                    onBlur={() => patchEndereco(i, { bairro: toTitleCase(e.bairro) })} />
                </Field>
                <Field label={t("papel.postalCode")}>
                  <input className="field font-mono" value={e.cep}
                    onChange={(ev) => patchEndereco(i, { cep: normalizarCep(ev.target.value) })}
                    placeholder={t("papel.postalCodePlaceholder")} />
                </Field>
                <Field label={t("papel.complement")}>
                  <input className="field" value={e.complemento}
                    onChange={(ev) => patchEndereco(i, { complemento: ev.target.value })}
                    onBlur={() => patchEndereco(i, { complemento: toTitleCase(e.complemento) })} />
                </Field>
              </div>
              <div className="mt-3">
                <CidadeSearchSelect
                  cidades={cidades}
                  value={e.idCidade}
                  onChange={(id) => patchEndereco(i, { idCidade: id })}
                />
              </div>
            </Section>
          ))}
          <button
            type="button"
            className="text-xs cursor-pointer underline-offset-2 hover:underline"
            style={{ color: v("--gold") }}
            onClick={adicionarEndereco}
          >
            {t("papel.addressAdd")}
          </button>
        </div>

        {erro && (
          <p className="text-sm px-3 py-2 rounded-md" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>{erro}</p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost px-4 py-2.5 text-sm" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" disabled={salvando} className="btn-gold px-5 py-2.5 text-sm min-w-28">
            {salvando ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </form>

      {previewPessoaId != null && (
        <PessoaPreviewModal
          idPessoa={previewPessoaId}
          cidades={cidades}
          recurso={recurso}
          onClose={() => setPreviewPessoaId(null)}
          onVincular={
            conflito && conflitoSemVinculoNaFilial(conflito, idFilialCadastro)
              ? () => {
                  setPreviewPessoaId(null);
                  void salvar(conflito.pessoa.id);
                }
              : conflito && conflito.idPapel == null
                ? () => {
                    setPreviewPessoaId(null);
                    void salvar(conflito.pessoa.id);
                  }
                : undefined
          }
        />
      )}
    </div>
  );
}

function CatalogHeader({ titulo, novoLabel, onNovo }: {
  titulo: string; count?: number; novoLabel: string; onNovo: () => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{titulo}</h1>
      <button className="btn-gold px-4 py-2 text-sm" onClick={onNovo}>{novoLabel}</button>
    </div>
  );
}

function DocumentosTiposPage({ paises, navReset }: { paises: Pais[]; navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<DocumentoTipo[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<DocumentoTipo | null>(null);
  const [idPais, setIdPais] = useState<number | "">("");
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("fisica");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [unico, setUnico] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      setItens(await listarTipos());
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, []);
  const filtered = itens.filter((item) =>
    `${item.codigo} ${item.nome} ${paises.find((p) => p.id === item.idPais)?.nome ?? ""} ${item.tipoPessoa}`.toLowerCase().includes(search.toLowerCase()),
  );
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (item, k) => {
    if (k === "pais") return paises.find((p) => p.id === item.idPais)?.nome ?? "";
    if (k === "pessoa") return item.tipoPessoa;
    if (k === "codigo") return item.codigo;
    if (k === "nome") return item.nome;
    if (k === "unico") return item.unico;
    return item.id;
  });
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

  function abrir(item?: DocumentoTipo) {
    setEditando(item ?? null);
    setIdPais(item?.idPais ?? paises[0]?.id ?? "");
    setTipoPessoa(item?.tipoPessoa ?? "fisica");
    setCodigo(item?.codigo ?? "");
    setNome(item?.nome ?? "");
    setUnico(item?.unico ?? true);
    setErro(null);
    setFormAberto(true);
  }

  async function salvar() {
    setErro(null);
    if (idPais === "" || !codigo.trim() || !nome.trim()) {
      setErro(t("documento.error.required"));
      return;
    }
    setSalvando(true);
    try {
      const body = {
        idPais: Number(idPais),
        tipoPessoa,
        codigo: codigo.trim().toUpperCase(),
        nome: toTitleCase(nome),
        unico,
      };
      if (editando) await atualizarTipoDocumento(editando.id, body);
      else await criarTipoDocumento(body);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (formAberto) {
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("documento.edit") : t("documento.new")}
        </h1>
        <form className="rounded-lg p-5 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("papel.country")} required>
            <select className="field" value={idPais} onChange={(e) => setIdPais(Number(e.target.value))}>
              {paises.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </Field>
          <Field label={t("papel.personType")} required>
            <select className="field" value={tipoPessoa} onChange={(e) => setTipoPessoa(e.target.value as TipoPessoa)}>
              <option value="fisica">{t("tipoPessoa.fisica")}</option>
              <option value="juridica">{t("tipoPessoa.juridica")}</option>
            </select>
          </Field>
          <Field label={t("documento.code")} required hint={t("documento.codeHint")}>
            <input className="field font-mono uppercase" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="CPF" />
          </Field>
          <Field label={t("documento.displayName")} required>
            <input className="field" value={nome} onChange={(e) => setNome(e.target.value)} onBlur={() => setNome((x) => toTitleCase(x))} />
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: v("--text-sub") }}>
            <input type="checkbox" checked={unico} onChange={(e) => setUnico(e.target.checked)} />
            {t("documento.uniqueLabel")}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  const paisNome = (id: number) => paises.find((p) => p.id === id)?.nome ?? "—";
  const paged = slicePage(ordenados, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.documentos")} count={itens.length} novoLabel={t("documento.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("col.searchDocTypes")}
        className="px-3 py-2 text-sm rounded-md outline-none w-72"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "col.id", sort: "id" },
                { label: "papel.country", sort: "pais" },
                { label: "col.person", sort: "pessoa" },
                { label: "col.code", sort: "codigo" },
                { label: "common.name", sort: "nome" },
                { label: "col.unique", sort: "unico" },
                "",
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((item) => (
              <tr key={item.id}>
                <Td mono gold>{item.id}</Td>
                <Td>{paisNome(item.idPais)}</Td>
                <Td>{item.tipoPessoa === "fisica" ? t("tipoPessoa.fisicaShort") : t("tipoPessoa.juridicaShort")}</Td>
                <Td mono>{item.codigo}</Td>
                <td className="drive-td font-medium" style={{ color: v("--text") }}>{item.nome}</td>
                <Td>{item.unico ? t("common.yes") : t("common.no")}</Td>
                <td className="drive-td text-right">
                  <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }} onClick={() => abrir(item)}>{t("common.edit")}</button>
                  <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                    onClick={async () => {
                      if (!confirm(tf(t, "documento.confirmDelete", { code: item.codigo }))) return;
                      try { await excluirTipoDocumento(item.id); await carregar(); }
                      catch (e) { setErro(mensagemErroApi(e, t, "common.error.deleteFailed")); }
                    }}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {filtered.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}

const PERFIS: { id: PerfilUsuario; labelKey: "perfil.administrador" | "perfil.gestor" | "perfil.operador" | "perfil.vendedor" }[] = [
  { id: "administrador", labelKey: "perfil.administrador" },
  { id: "gestor", labelKey: "perfil.gestor" },
  { id: "operador", labelKey: "perfil.operador" },
  { id: "vendedor", labelKey: "perfil.vendedor" },
];

function perfilLabel(perfil: PerfilUsuario, t: (key: import("@/i18n/translations").TranslationKey) => string) {
  const item = PERFIS.find((p) => p.id === perfil);
  return item ? t(item.labelKey) : perfil;
}

function UsuariosPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<Usuario[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nome, setNome] = useState("");
  const [loginField, setLoginField] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>("operador");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [idsFiliais, setIdsFiliais] = useState<number[]>([]);
  const [idsCaixas, setIdsCaixas] = useState<number[]>([]);
  const [idCaixaPadrao, setIdCaixaPadrao] = useState<number | null>(null);
  const [filiaisDisponiveis, setFiliaisDisponiveis] = useState<Filial[]>([]);
  const [caixasDisponiveis, setCaixasDisponiveis] = useState<Caixa[]>([]);
  const [salvando, setSalvando] = useState(false);
  const erroRef = useRef<HTMLDivElement>(null);
  const protegido = editando?.login === "system";

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      setItens(await listarUsuarios());
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, []);
  const { statusBusyId, alternar } = useAlternarStatus(
    setItens,
    (u, proximo) => atualizarUsuario(u.id, {
      nome: u.nome,
      login: u.login,
      email: u.email,
      perfil: u.perfil,
      status: proximo,
      idsFiliais: (u.filiais ?? []).map((f) => f.id),
      idsCaixas: (u.caixas ?? []).map((c) => c.id),
      idCaixaPadrao: (u.caixas ?? []).find((c) => c.padrao)?.id ?? u.caixas?.[0]?.id ?? null,
    }),
    (e) => setErro(mensagemErroApi(e, t, "common.error.saveFailed")),
    carregar,
  );
  useEffect(() => {
    void listarFiliais().then(setFiliaisDisponiveis).catch(() => setFiliaisDisponiveis([]));
  }, []);
  useEffect(() => {
    if (!idsFiliais.length) {
      setCaixasDisponiveis([]);
      return;
    }
    void Promise.all(idsFiliais.map((id) => listarCaixas(id)))
      .then((listas) => {
        const todos = listas.flat();
        setCaixasDisponiveis(todos);
        setIdsCaixas((atual) => {
          const ids = todos.map((c) => c.id);
          const keep = atual.filter((id) => ids.includes(id));
          return keep.length ? keep : ids;
        });
        setIdCaixaPadrao((atual) => {
          const ids = todos.map((c) => c.id);
          if (atual && ids.includes(atual)) return atual;
          return ids[0] ?? null;
        });
      })
      .catch(() => setCaixasDisponiveis([]));
  }, [idsFiliais]);
  useEffect(() => {
    if (erro) erroRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [erro]);
  const filteredUsuarios = itens.filter((u) =>
    passaFiltroStatus(u.status, filtroStatus) &&
    `${u.nome} ${u.login} ${u.email} ${u.perfil}`.toLowerCase().includes(search.toLowerCase()));
  const { items: usuariosOrdenados, sortKey, sortDir, onSort } = useListSort(filteredUsuarios, (u, k) => {
    if (k === "nome") return u.nome;
    if (k === "login") return u.login;
    if (k === "email") return u.email;
    if (k === "perfil") return u.perfil;
    return u.id;
  });
  useEffect(() => { setPage(1); }, [search, filtroStatus, sortKey, sortDir]);

  function abrir(item?: Usuario) {
    setEditando(item ?? null);
    setNome(item?.nome ?? "");
    setLoginField(item?.login ?? "");
    setEmail(item?.email ?? "");
    setSenha("");
    setPerfil(item?.perfil ?? "operador");
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    const vinculadas = item?.filiais?.map((f) => f.id) ?? [];
    if (vinculadas.length) {
      setIdsFiliais(vinculadas);
    } else {
      const principal = filiaisDisponiveis.find((f) => f.principal);
      setIdsFiliais(principal ? [principal.id] : filiaisDisponiveis[0] ? [filiaisDisponiveis[0].id] : []);
    }
    const caixasUser = item?.caixas ?? [];
    setIdsCaixas(caixasUser.map((c) => c.id));
    setIdCaixaPadrao(caixasUser.find((c) => c.padrao)?.id ?? caixasUser[0]?.id ?? null);
    setErro(null);
    setFormAberto(true);
  }

  async function salvar() {
    setErro(null);
    if (protegido) {
      setErro(t("usuario.error.systemProtected"));
      return;
    }
    if (!nome.trim() || !loginField.trim() || !email.trim()) {
      setErro(t("usuario.error.required"));
      return;
    }
    if (!editando && !senha.trim()) {
      setErro(t("usuario.error.passwordRequired"));
      return;
    }
    if (senha.trim() && senha.trim().length < 8) {
      setErro(t("usuario.error.passwordMin"));
      return;
    }
    if (!idsFiliais.length) {
      setErro(t("usuario.error.branchesRequired"));
      return;
    }
    setSalvando(true);
    try {
      const body: Record<string, unknown> = {
        nome: toTitleCase(nome),
        login: loginField.trim().toLowerCase(),
        email: toEmailLower(email),
        perfil,
        status,
        idsFiliais,
        idsCaixas,
        idCaixaPadrao,
      };
      if (senha.trim()) body.senha = senha.trim();
      if (editando) await atualizarUsuario(editando.id, body);
      else await criarUsuario(body);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (formAberto) {
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("usuario.edit") : t("usuario.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {protegido && (
            <p className="text-sm px-3 py-2 rounded-md" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
              {t("usuario.error.systemProtected")}
            </p>
          )}
          <Field label={t("common.name")} required>
            <input className="field" autoFocus={!protegido} disabled={protegido} value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNome((x) => toTitleCase(x))} placeholder="Maria Silva" />
          </Field>
          <Field label={t("common.login")} required>
            <input className="field font-mono" disabled={protegido} value={loginField} onChange={(e) => setLoginField(e.target.value)}
              onBlur={() => setLoginField((x) => x.trim().toLowerCase())} placeholder="maria.silva" />
          </Field>
          <Field label={t("common.email")} required>
            <input className="field" type="email" disabled={protegido} value={email} onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmail((x) => toEmailLower(x))} placeholder="maria@exemplo.com" />
          </Field>
          <Field label={t("common.password")} required={!editando} hint={editando ? t("usuario.passwordHint") : t("common.passwordMinHint")}>
            <input className="field" type="password" autoComplete="new-password" disabled={protegido} value={senha}
              onChange={(e) => setSenha(e.target.value)} placeholder={editando ? "••••••••" : ""} />
          </Field>
          <Field label={t("common.profile")} required>
            <select className="field" disabled={protegido} value={perfil} onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}>
              {PERFIS.map((p) => <option key={p.id} value={p.id}>{t(p.labelKey)}</option>)}
            </select>
          </Field>
          <div>
            <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>
              {t("usuario.branches")}<span style={{ color: v("--gold") }}> *</span>
            </span>
            <div className="mt-1.5 rounded-md px-3" style={{ background: v("--card2"), border: `1px solid ${v("--border")}` }}>
              {filiaisDisponiveis.map((f, i) => (
                <label
                  key={f.id}
                  className={`flex items-center gap-2 py-2.5 ${protegido ? "cursor-default" : "cursor-pointer"}`}
                  style={{ borderBottom: i < filiaisDisponiveis.length - 1 ? `1px solid ${v("--border")}` : undefined }}
                >
                  <input
                    type="checkbox"
                    disabled={protegido}
                    checked={idsFiliais.includes(f.id)}
                    onChange={(e) => {
                      setIdsFiliais((atual) => e.target.checked ? [...atual, f.id] : atual.filter((id) => id !== f.id));
                    }}
                  />
                  <span className="text-sm" style={{ color: v("--text") }}>{f.nome}</span>
                  {f.principal && (
                    <span className="text-[11px]" style={{ color: v("--gold") }}>{t("empresa.principal")}</span>
                  )}
                </label>
              ))}
              {!filiaisDisponiveis.length && (
                <p className="text-xs py-3" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</p>
              )}
            </div>
          </div>
          <div>
            <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>
              {t("usuario.caixas")}<span style={{ color: v("--gold") }}> *</span>
            </span>
            <div className="mt-1.5 rounded-md px-3" style={{ background: v("--card2"), border: `1px solid ${v("--border")}` }}>
              {caixasDisponiveis.map((c, i) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 py-2.5 ${protegido ? "cursor-default" : "cursor-pointer"}`}
                  style={{ borderBottom: i < caixasDisponiveis.length - 1 ? `1px solid ${v("--border")}` : undefined }}
                >
                  <input
                    type="checkbox"
                    disabled={protegido}
                    checked={idsCaixas.includes(c.id)}
                    onChange={(e) => {
                      setIdsCaixas((atual) => {
                        const next = e.target.checked ? [...atual, c.id] : atual.filter((id) => id !== c.id);
                        if (!next.includes(idCaixaPadrao ?? -1)) setIdCaixaPadrao(next[0] ?? null);
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm flex-1" style={{ color: v("--text") }}>{c.nome} · {c.filialNome}</span>
                  <label className="flex items-center gap-1 text-[11px]" style={{ color: v("--text-muted") }}>
                    <input
                      type="radio"
                      disabled={protegido || !idsCaixas.includes(c.id)}
                      checked={idCaixaPadrao === c.id}
                      onChange={() => setIdCaixaPadrao(c.id)}
                    />
                    {t("usuario.caixaPadrao")}
                  </label>
                </label>
              ))}
              {!caixasDisponiveis.length && (
                <p className="text-xs py-3" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</p>
              )}
            </div>
          </div>
          {editando && (
            <Field label={t("common.status")}>
              <select className="field" disabled={protegido} value={status} onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}>
                <option value="ativo">{t("common.active")}</option>
                <option value="inativo">{t("common.inactive")}</option>
              </select>
            </Field>
          )}
          {(erro || protegido) && (
            <div ref={erroRef} className="pt-1" style={{ borderTop: `1px solid ${v("--border")}` }}>
              <p className="text-sm px-3 py-2 rounded-md" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
                {erro ?? t("usuario.error.systemProtected")}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            {!protegido && (
              <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
            )}
          </div>
        </form>
      </div>
    );
  }

  const paged = slicePage(usuariosOrdenados, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("usuario.title")} count={itens.length} novoLabel={t("usuario.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("usuario.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "col.id", sort: "id" },
                { label: "common.name", sort: "nome" },
                { label: "common.login", sort: "login" },
                { label: "common.email", sort: "email" },
                { label: "common.profile", sort: "perfil" },
                { label: "usuario.branches" },
                { label: "common.status" },
                "",
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((u) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td mono gold>{u.id}</Td>
                <td className="drive-td text-xs font-medium" style={{ color: v("--text") }}>{u.nome}</td>
                <Td mono>{u.login}</Td>
                <Td mono>{u.email}</Td>
                <Td>{perfilLabel(u.perfil, t)}</Td>
                <Td clip title={(u.filiais ?? []).map((f) => f.nome).join(", ") || "—"}>
                  {(u.filiais ?? []).map((f) => f.nome).join(", ") || "—"}
                </Td>
                <td className="drive-td drive-td-status" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge
                    status={u.status === "inativo" ? "inativo" : "ativo"}
                    disabled={u.login === "system" || statusBusyId === u.id}
                    onToggle={u.login === "system" ? undefined : () => void alternar(u)}
                  />
                </td>
                <td className="drive-td text-right">
                  <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }} onClick={() => abrir(u)}>{t("common.edit")}</button>
                  {u.login !== "system" && (
                    <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                      onClick={async () => {
                        if (!confirm(tf(t, "common.confirmDelete", { name: u.nome }))) return;
                        try { await excluirUsuario(u.id); await carregar(); }
                        catch (e) { setErro(mensagemErroApi(e, t, "common.error.deleteFailed")); }
                      }}>{t("common.delete")}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredUsuarios.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {filteredUsuarios.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}

function PaisesPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<Pais[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Pais | null>(null);
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [usaSigla, setUsaSigla] = useState(true);
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [salvando, setSalvando] = useState(false);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      setItens(await listarPaises());
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, []);
  const { statusBusyId, alternar } = useAlternarStatus(
    setItens,
    (p, proximo) => atualizarPais(p.id, {
      nome: p.nome,
      sigla: p.sigla,
      usaSiglaDivisao: p.usaSiglaDivisao,
      status: proximo,
    }),
    (e) => setErro(mensagemErroApi(e, t, "common.error.saveFailed")),
    carregar,
  );
  const filteredPaises = itens.filter((p) =>
    passaFiltroStatus(p.status, filtroStatus) && `${p.nome} ${p.sigla}`.toLowerCase().includes(search.toLowerCase()));
  const { items: paisesOrdenados, sortKey, sortDir, onSort } = useListSort(filteredPaises, (p, k) => {
    if (k === "nome") return p.nome;
    if (k === "sigla") return p.sigla;
    if (k === "divisao") return p.usaSiglaDivisao ? 1 : 0;
    return p.id;
  });
  useEffect(() => { setPage(1); }, [search, filtroStatus, sortKey, sortDir]);

  function abrir(item?: Pais) {
    setEditando(item ?? null);
    setNome(item?.nome ?? "");
    setSigla(item?.sigla ?? "");
    setUsaSigla(item?.usaSiglaDivisao ?? true);
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    setErro(null);
    setFormAberto(true);
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim() || !sigla.trim()) {
      setErro(t("pais.error.required"));
      return;
    }
    setSalvando(true);
    try {
      const body = { nome: toTitleCase(nome), sigla: sigla.trim().toUpperCase(), usaSiglaDivisao: usaSigla, status };
      if (editando) await atualizarPais(editando.id, body);
      else await criarPais(body);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (formAberto) {
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("pais.edit") : t("pais.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("common.name")} required>
            <input className="field" autoFocus value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNome((x) => toTitleCase(x))} placeholder={t("pais.placeholderName")} />
          </Field>
          <Field label={t("pais.isoSigla")} required hint={t("pais.isoHint")}>
            <input className="field font-mono uppercase" maxLength={2} value={sigla}
              onChange={(e) => setSigla(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())} />
          </Field>
          <Field label={t("pais.useDivisionSigla")}>
            <select className="field" value={usaSigla ? "sim" : "nao"} onChange={(e) => setUsaSigla(e.target.value === "sim")}>
              <option value="sim">{t("pais.divisionSiglaUf")}</option>
              <option value="nao">{t("pais.divisionSiglaDept")}</option>
            </select>
          </Field>
          {editando && (
            <Field label={t("common.status")}>
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}>
                <option value="ativo">{t("common.active")}</option>
                <option value="inativo">{t("common.inactive")}</option>
              </select>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  const paged = slicePage(paisesOrdenados, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.paises")} count={itens.length} novoLabel={t("pais.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("pais.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "col.id", sort: "id" },
                { label: "common.name", sort: "nome" },
                { label: "col.initials", sort: "sigla" },
                { label: "col.division", sort: "divisao" },
                { label: "common.status" },
                "",
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td mono gold>{p.id}</Td>
                <td className="drive-td text-xs font-medium" style={{ color: v("--text") }}>{p.nome}</td>
                <Td mono>{p.sigla}</Td>
                <Td sub>{p.usaSiglaDivisao ? t("pais.divisionTypeUf") : t("pais.divisionTypeDept")}</Td>
                <td className="drive-td drive-td-status" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge
                    status={p.status === "inativo" ? "inativo" : "ativo"}
                    disabled={statusBusyId === p.id}
                    onToggle={() => void alternar(p)}
                  />
                </td>
                <td className="drive-td text-right">
                  <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }} onClick={() => abrir(p)}>{t("common.edit")}</button>
                  <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                    onClick={async () => {
                      if (!confirm(tf(t, "common.confirmDelete", { name: p.nome }))) return;
                      try { await excluirPais(p.id); await carregar(); }
                      catch (e) { setErro(mensagemErroApi(e, t, "common.error.deleteFailed")); }
                    }}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredPaises.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {filteredPaises.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}

function DivisoesPage({ paises, navReset }: { paises: Pais[]; navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<Divisao[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Divisao | null>(null);
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [idPais, setIdPais] = useState<number | "">("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [salvando, setSalvando] = useState(false);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      setItens(await listarDivisoes());
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, []);
  const { statusBusyId, alternar } = useAlternarStatus(
    setItens,
    (d, proximo) => atualizarDivisao(d.id, {
      nome: d.nome,
      idPais: d.idPais,
      sigla: d.sigla,
      status: proximo,
    }),
    (e) => setErro(mensagemErroApi(e, t, "common.error.saveFailed")),
    carregar,
  );
  const paisNome = (id: number) => paises.find((p) => p.id === id)?.nome ?? "—";
  const filteredDivisoes = itens.filter((d) =>
    passaFiltroStatus(d.status, filtroStatus) && `${d.nome} ${d.sigla ?? ""} ${paisNome(d.idPais)}`.toLowerCase().includes(search.toLowerCase()));
  const { items: divisoesOrdenadas, sortKey, sortDir, onSort } = useListSort(filteredDivisoes, (d, k) => {
    if (k === "nome") return d.nome;
    if (k === "sigla") return d.sigla ?? "";
    if (k === "pais") return paisNome(d.idPais);
    return d.id;
  });
  useEffect(() => { setPage(1); }, [search, filtroStatus, sortKey, sortDir]);
  const paisPadrao = paises.find((p) => p.sigla === "BR") ?? paises[0];

  function abrir(item?: Divisao) {
    setEditando(item ?? null);
    setNome(item?.nome ?? "");
    setSigla(item?.sigla ?? "");
    setIdPais(item?.idPais ?? paisPadrao?.id ?? "");
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    setErro(null);
    setFormAberto(true);
  }

  async function salvar() {
    setErro(null);
    if (!nome.trim() || idPais === "") {
      setErro(t("divisao.error.required"));
      return;
    }
    setSalvando(true);
    try {
      const body = { nome: toTitleCase(nome), idPais: Number(idPais), sigla: sigla.trim().toUpperCase() || null, status };
      if (editando) await atualizarDivisao(editando.id, body);
      else await criarDivisao(body);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (formAberto) {
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("divisao.edit") : t("divisao.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("papel.country")} required>
            <select className="field" value={idPais} onChange={(e) => setIdPais(Number(e.target.value))}>
              {paises.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </Field>
          <Field label={t("common.name")} required>
            <input className="field" autoFocus value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNome((x) => toTitleCase(x))} placeholder={t("divisao.placeholderName")} />
          </Field>
          <Field label={t("col.initials")} hint={t("divisao.siglaHint")}>
            <input className="field font-mono uppercase" maxLength={10} value={sigla}
              onChange={(e) => setSigla(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())} />
          </Field>
          {editando && (
            <Field label={t("common.status")}>
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}>
                <option value="ativo">{t("common.active")}</option>
                <option value="inativo">{t("common.inactive")}</option>
              </select>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  const paged = slicePage(divisoesOrdenadas, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.divisoes")} count={itens.length} novoLabel={t("divisao.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("divisao.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "col.id", sort: "id" },
                { label: "common.name", sort: "nome" },
                { label: "col.initials", sort: "sigla" },
                { label: "papel.country", sort: "pais" },
                { label: "common.status" },
                "",
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((d) => (
              <tr key={d.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td mono gold>{d.id}</Td>
                <td className="drive-td text-xs font-medium" style={{ color: v("--text") }}>{d.nome}</td>
                <Td mono sub>{d.sigla ?? "—"}</Td>
                <Td sub>{paisNome(d.idPais)}</Td>
                <td className="drive-td drive-td-status" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge
                    status={d.status === "inativo" ? "inativo" : "ativo"}
                    disabled={statusBusyId === d.id}
                    onToggle={() => void alternar(d)}
                  />
                </td>
                <td className="drive-td text-right">
                  <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }} onClick={() => abrir(d)}>{t("common.edit")}</button>
                  <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                    onClick={async () => {
                      if (!confirm(tf(t, "common.confirmDelete", { name: d.nome }))) return;
                      try { await excluirDivisao(d.id); await carregar(); }
                      catch (e) { setErro(mensagemErroApi(e, t, "common.error.deleteFailed")); }
                    }}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredDivisoes.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {filteredDivisoes.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}

function CidadesPage({ paises: paisesProp, navReset }: { paises: Pais[]; navReset: number }) {
  const { t } = useI18n();
  const [itens, setItens] = useState<Cidade[]>([]);
  const [divisoes, setDivisoes] = useState<Divisao[]>([]);
  const [paisesLocal, setPaisesLocal] = useState<Pais[]>([]);
  const paises = paisesProp.length > 0 ? paisesProp : paisesLocal;
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Cidade | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"municipio" | "distrito">("municipio");
  const [idMunicipio, setIdMunicipio] = useState<number | "">("");
  const [idPais, setIdPais] = useState<number | "">("");
  const [idDivisao, setIdDivisao] = useState<number | "">("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [salvando, setSalvando] = useState(false);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      const [c, d] = await Promise.all([listarCidades(), listarDivisoes()]);
      setItens(c);
      setDivisoes(d);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, []);
  const { statusBusyId, alternar } = useAlternarStatus(
    setItens,
    (c, proximo) => atualizarCidade(c.id, {
      nome: c.nome,
      idDivisao: c.idDivisao,
      tipo: c.tipo ?? "municipio",
      idCidadeMunicipio: c.idCidadeMunicipio ?? null,
      status: proximo,
    }),
    (e) => setErro(mensagemErroApi(e, t, "common.error.saveFailed")),
    carregar,
  );
  const filteredCidades = itens.filter((c) =>
    passaFiltroStatus(c.status, filtroStatus) &&
    `${c.nome} ${c.municipioNome ?? ""} ${c.tipo} ${c.divisaoNome} ${c.paisNome}`.toLowerCase().includes(search.toLowerCase()));
  const { items: cidadesOrdenadas, sortKey, sortDir, onSort } = useListSort(filteredCidades, (c, k) => {
    if (k === "nome") return c.nome;
    if (k === "tipo") return c.tipo;
    if (k === "divisao") return c.divisaoNome;
    if (k === "pais") return c.paisNome;
    return c.id;
  });
  useEffect(() => { setPage(1); }, [search, filtroStatus, sortKey, sortDir]);

  useEffect(() => {
    if (paisesProp.length > 0) return;
    void listarPaises({ logoutOn401: false }).then(setPaisesLocal).catch(() => {});
  }, [paisesProp.length]);

  const paisPadrao = paises.find((p) => p.sigla === "BR") ?? paises[0];
  const divisoesDoPais = divisoes.filter((d) => d.idPais === idPais);
  const idPaisSelect = paises.some((p) => p.id === idPais) ? idPais : "";

  useEffect(() => {
    if (!formAberto || idPais !== "" || !paisPadrao) return;
    setIdPais(paisPadrao.id);
  }, [formAberto, idPais, paisPadrao]);

  function abrir(item?: Cidade) {
    setEditando(item ?? null);
    setNome(item?.nome ?? "");
    setTipo(item?.tipo === "distrito" ? "distrito" : "municipio");
    setIdMunicipio(item?.idCidadeMunicipio ?? "");
    setIdPais(item?.idPais ?? paisPadrao?.id ?? "");
    setIdDivisao(item?.idDivisao ?? "");
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    setErro(null);
    setFormAberto(true);
  }

  useEffect(() => {
    if (!formAberto || idPais === "") return;
    if (idDivisao !== "" && !divisoes.some((d) => d.id === idDivisao && d.idPais === idPais)) {
      setIdDivisao("");
      setIdMunicipio("");
    }
  }, [idPais, formAberto]);

  async function salvar() {
    setErro(null);
    if (!nome.trim() || idDivisao === "") {
      setErro(t("cidade.error.required"));
      return;
    }
    if (tipo === "distrito" && idMunicipio === "") {
      setErro(t("cidade.error.municipioRequired"));
      return;
    }
    setSalvando(true);
    try {
      const body = {
        nome: toTitleCase(nome),
        idDivisao: Number(idDivisao),
        tipo,
        idCidadeMunicipio: tipo === "distrito" ? Number(idMunicipio) : null,
        status,
      };
      if (editando) await atualizarCidade(editando.id, body);
      else await criarCidade(body);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  if (formAberto) {
    return (
      <div className="space-y-5 max-w-xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("cidade.edit") : t("cidade.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("papel.country")} required>
            <select
              className="field"
              value={idPaisSelect}
              disabled={paises.length === 0}
              onChange={(e) => setIdPais(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">{paises.length === 0 ? t("system.checking") : t("cidade.selectDivision")}</option>
              {paises.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </Field>
          <Field label={t("col.divisionRegion")} required>
            <select className="field" value={idDivisao} onChange={(e) => {
              setIdDivisao(e.target.value ? Number(e.target.value) : "");
              setIdMunicipio("");
            }}>
              <option value="">{t("cidade.selectDivision")}</option>
              {divisoesDoPais.map((d) => (
                <option key={d.id} value={d.id}>{d.sigla ? `${d.nome} (${d.sigla})` : d.nome}</option>
              ))}
            </select>
          </Field>
          <Field label={t("cidade.tipo")} required>
            <select
              className="field"
              value={tipo}
              onChange={(e) => {
                const proximo = e.target.value as "municipio" | "distrito";
                setTipo(proximo);
                if (proximo === "municipio") setIdMunicipio("");
              }}
            >
              <option value="municipio">{t("cidade.tipo.municipio")}</option>
              <option value="distrito">{t("cidade.tipo.distrito")}</option>
            </select>
          </Field>
          {tipo === "distrito" && (
            <CidadeSearchSelect
              label={t("cidade.municipio")}
              required
              cidades={itens.filter((c) =>
                (c.tipo ?? "municipio") !== "distrito"
                && (idDivisao === "" || c.idDivisao === idDivisao)
                && c.id !== editando?.id)}
              value={idMunicipio}
              onChange={setIdMunicipio}
            />
          )}
          <Field label={t("common.name")} required>
            <input className="field" autoFocus value={nome} onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNome((x) => toTitleCase(x))} placeholder={t("cidade.placeholderName")} />
          </Field>
          {editando && (
            <Field label={t("common.status")}>
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}>
                <option value="ativo">{t("common.active")}</option>
                <option value="inativo">{t("common.inactive")}</option>
              </select>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  const paged = slicePage(cidadesOrdenadas, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.cidades")} count={itens.length} novoLabel={t("cidade.new")} onNovo={() => abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("cidade.listSearchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
                cols={[
                  { label: "col.id", sort: "id" },
                  { label: "common.name", sort: "nome" },
                  { label: "cidade.tipo", sort: "tipo" },
                  { label: "col.divisionRegion", sort: "divisao" },
                  { label: "papel.country", sort: "pais" },
                  { label: "common.status" },
                  "",
                ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((c) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td mono gold>{c.id}</Td>
                <td className="drive-td" title={rotuloCidade(c, true)}>
                  <p className="text-xs font-medium" style={{ color: v("--text") }}>{c.nome}</p>
                  {c.tipo === "distrito" && c.municipioNome ? (
                    <p className="text-[11px]" style={{ color: v("--text-muted") }}>{c.municipioNome}</p>
                  ) : null}
                </td>
                <Td sub>{c.tipo === "distrito" ? t("cidade.tipo.distrito") : t("cidade.tipo.municipio")}</Td>
                <Td sub>{c.divisaoSigla ? `${c.divisaoNome} (${c.divisaoSigla})` : c.divisaoNome}</Td>
                <Td sub>{c.paisNome}</Td>
                <td className="drive-td drive-td-status" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge
                    status={c.status === "inativo" ? "inativo" : "ativo"}
                    disabled={statusBusyId === c.id}
                    onToggle={() => void alternar(c)}
                  />
                </td>
                <td className="drive-td text-right">
                  <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }} onClick={() => abrir(c)}>{t("common.edit")}</button>
                  <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                    onClick={async () => {
                      if (!confirm(tf(t, "common.confirmDelete", { name: c.nome }))) return;
                      try { await excluirCidade(c.id); await carregar(); }
                      catch (e) { setErro(mensagemErroApi(e, t, "common.error.deleteFailed")); }
                    }}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredCidades.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {filteredCidades.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}

function VendasEmBreve() {
  const { t } = useI18n();
  return (
    <div className="max-w-lg py-16">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("access.vendasSoon")}</h1>
      <p className="text-sm mt-2" style={{ color: v("--text-muted") }}>{t("access.vendasSoonHint")}</p>
    </div>
  );
}

function AppShell({ systemStatus }: { systemStatus: SystemStatus }) {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const { filial } = useFilial();
  const systemOnline = systemStatus === "online";
  const viewsOk = useMemo(
    () => navTodas.filter((item) => navPermitido(item.permissao, hasPermission)).map((item) => item.id),
    [hasPermission],
  );
  const [view, setView] = useState<View | null>(viewsOk[0] ?? null);
  const [navReset, setNavReset] = useState(0);
  const { light, toggle } = useTheme();
  const [clientes, setClientes] = useState<Papel[]>([]);
  const [fornecedores, setFornecedores] = useState<Papel[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);

  useEffect(() => {
    if (view && viewsOk.includes(view)) return;
    setView(viewsOk[0] ?? null);
  }, [view, viewsOk]);

  useEffect(() => {
    // Catálogo leve: não espera lista de clientes/fornecedores (era a causa da demora no Novo).
    void (async () => {
      try {
        const opts = { logoutOn401: false as const };
        const [cid, p] = await Promise.all([
          listarCidades(undefined, undefined, opts),
          listarPaises(opts),
        ]);
        setCidades(cid);
        setPaises(p);
        await aquecerCacheTiposDocumento();
      } catch {
        /* mantém dados já carregados */
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const opts = { logoutOn401: false as const };
        const [c, f] = await Promise.all([
          listarPapeis("clientes", filial?.id, opts),
          listarPapeis("fornecedores", filial?.id, opts),
        ]);
        setClientes(c);
        setFornecedores(f);
      } catch {
        /* mantém dados já carregados */
      }
    })();
  }, [filial?.id]);

  const titles: Record<View, string> = {
    dashboard: t("nav.dashboard"),
    vendas: t("nav.vendas"),
    historico: t("nav.historico"),
    relatorioReceber: t("nav.relatorioReceber"),
    relatorioPagar: t("nav.relatorioPagar"),
    relatorioVendas: t("nav.relatorioVendas"),
    relatorioEstoque: t("nav.relatorioEstoque"),
    contasReceber: t("nav.contasReceber"),
    contasPagar: t("nav.contasPagar"),
    entradaNota: t("nav.entradaNota"),
    facturas: t("nav.facturas"),
    caixa: t("nav.caixa"),
    clientes: t("nav.clientes"),
    fornecedores: t("nav.fornecedores"),
    produtos: t("nav.produtos"),
    marcas: t("nav.marcas"),
    modelos: t("nav.modelos"),
    estoques: t("nav.estoques"),
    cotacoes: t("nav.cotacoes"),
    finalizadores: t("nav.finalizadores"),
    caixas: t("nav.caixas"),
    usuarios: t("nav.usuarios"),
    empresa: t("nav.empresa"),
    paises: t("nav.paises"),
    documentos: t("nav.documentos"),
    divisoes: t("nav.divisoes"),
    cidades: t("nav.cidades"),
  };

  function navigateTo(next: View) {
    if (!viewsOk.includes(next)) return;
    if (next === view) setNavReset((n) => n + 1);
    else setView(next);
  }

  return (
    <div className="flex min-h-screen" style={{ background: v("--bg") }}>
      <Sidebar view={view} onNavigate={navigateTo} systemStatus={systemStatus} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-10" style={{ background: v("--topbar-bg"), backdropFilter: "blur(8px)" }}>
          <div className="px-8 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${v("--border")}` }}>
            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: v("--text-muted") }}>
              <span style={{ color: v("--gold") }}>{t("app.name")}</span>
              <span>/</span>
              <span>{view ? titles[view] : t("access.vendasSoon")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CotacaoChip />
              <FilialSwitcher />
              <ThemeToggle light={light} onToggle={toggle} compact />
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
          <CotacaoAlerta onOpenCadastro={() => navigateTo("cotacoes")} />
        </div>
        <div className="px-8 py-6" key={filial?.id ?? "filial"}>
          {view === null && <VendasEmBreve />}
          {view === "dashboard" && (
            <Dashboard
              clientes={clientes}
              fornecedores={fornecedores}
              systemOnline={systemOnline}
              onNavigate={navigateTo}
            />
          )}
          {view === "vendas" && <VendasPage navReset={navReset} />}
          {view === "historico" && <HistoricoVendasPage navReset={navReset} />}
          {(view === "relatorioReceber" || view === "relatorioPagar" || view === "relatorioVendas" || view === "relatorioEstoque") && (
            <RelatoriosPage
              key={view}
              navReset={navReset}
              relatorio={view === "relatorioReceber" ? "receber" : view === "relatorioPagar" ? "pagar" : view === "relatorioEstoque" ? "estoque" : "vendas"}
            />
          )}
          {view === "contasReceber" && <ContasReceberPage navReset={navReset} />}
          {view === "contasPagar" && <ContasPagarPage navReset={navReset} />}
          {view === "entradaNota" && <EntradaNotaPage navReset={navReset} />}
          {view === "facturas" && <FacturasPage navReset={navReset} />}
          {view === "caixa" && <CaixaOperacaoPage navReset={navReset} />}
          {view === "clientes" && <PapelPage recurso="clientes" titulo={t("nav.clientes")} singular={t("entity.cliente")} cidades={cidades} paises={paises} navReset={navReset} onNavigate={navigateTo} />}
          {view === "fornecedores" && <PapelPage recurso="fornecedores" titulo={t("nav.fornecedores")} singular={t("entity.fornecedor")} cidades={cidades} paises={paises} navReset={navReset} onNavigate={navigateTo} />}
          {view === "produtos" && <ProdutosPage navReset={navReset} />}
          {view === "marcas" && <MarcasPage navReset={navReset} />}
          {view === "modelos" && <ModelosPage navReset={navReset} />}
          {view === "estoques" && <EstoquesPage navReset={navReset} />}
          {view === "cotacoes" && <CotacoesPage navReset={navReset} />}
          {view === "finalizadores" && <FinalizadoresPage navReset={navReset} />}
          {view === "caixas" && <CaixasPage navReset={navReset} />}
          {view === "usuarios" && <UsuariosPage navReset={navReset} />}
          {view === "empresa" && <EmpresaPage cidades={cidades} navReset={navReset} />}
          {view === "paises" && <PaisesPage navReset={navReset} />}
          {view === "documentos" && <DocumentosTiposPage paises={paises} navReset={navReset} />}
          {view === "divisoes" && <DivisoesPage paises={paises} navReset={navReset} />}
          {view === "cidades" && <CidadesPage paises={paises} navReset={navReset} />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const { t, setLocale } = useI18n();
  const { light, toggle } = useTheme();
  const systemStatus = useSystemHeartbeat();

  useEffect(() => {
    if (user?.idioma) setLocale(user.idioma);
  }, [user?.idioma, setLocale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: v("--bg"), color: v("--text-muted") }}>
        {t("system.checking")}
      </div>
    );
  }

  if (!user) {
    return <LoginPage light={light} onToggleTheme={toggle} systemStatus={systemStatus} />;
  }

  return (
    <CotacaoHojeProvider>
      <FilialProvider>
        <FilialGate light={light} onToggleTheme={toggle} systemStatus={systemStatus}>
          <AppShell systemStatus={systemStatus} />
        </FilialGate>
      </FilialProvider>
    </CotacaoHojeProvider>
  );
}
