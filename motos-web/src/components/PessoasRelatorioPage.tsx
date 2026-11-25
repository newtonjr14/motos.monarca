import { useEffect, useMemo, useRef, useState } from "react";
import { listarPapeis, Permissao, type Cidade, type Papel, type Pessoa } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import PapelFicha from "@/components/PapelFicha";
import RelatorioFolha, { baixarPlanilha, type FolhaRelatorio } from "@/components/RelatorioFolha";
import {
  ListToolbar,
  StatusFilter,
  StatusTexto,
  TableHeadRow,
  TablePagination,
  Td,
  passaFiltroStatus,
  useListSort,
  type FiltroStatus,
} from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import {
  enderecoPrincipal,
  formatarCidade,
  formatarDataHoraEpoch,
  formatarDocumentoExibicao,
  formatarTelefoneExibicao,
  slicePage,
} from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

function telefoneLinha(pessoa: Pessoa): string {
  const nums = [
    formatarTelefoneExibicao(pessoa.ddi, pessoa.telefone),
    formatarTelefoneExibicao(pessoa.ddi2, pessoa.telefone2),
  ].filter((n) => n !== "—");
  return nums.join(" · ") || "—";
}

function MenuExportar({ disabled, onPdf, onExcel }: {
  disabled: boolean;
  onPdf: () => void;
  onExcel: () => void;
}) {
  const { t } = useI18n();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fecha(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setAberto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fecha);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fecha);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-ghost px-3 py-1.5 text-xs"
        disabled={disabled}
        aria-expanded={aberto}
        aria-haspopup="menu"
        onClick={() => setAberto((atual) => !atual)}
      >
        {t("relatorio.exportar")}
      </button>
      {aberto && !disabled && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[9rem] rounded-md py-1 shadow-lg"
          style={{ background: v("--card"), border: border1() }}
          role="menu"
        >
          <button type="button" className="block w-full px-3 py-1.5 text-left text-xs" role="menuitem" style={{ color: v("--text") }} onClick={() => { setAberto(false); onPdf(); }}>
            {t("relatorio.pdf")}
          </button>
          <button type="button" className="block w-full px-3 py-1.5 text-left text-xs" role="menuitem" style={{ color: v("--text") }} onClick={() => { setAberto(false); onExcel(); }}>
            {t("relatorio.excel")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PessoasRelatorioPage({
  recurso,
  cidades,
  navReset,
  onNavigate,
}: {
  recurso: "clientes" | "fornecedores";
  cidades: Cidade[];
  navReset: number;
  onNavigate: (v: "clientes" | "fornecedores") => void;
}) {
  const { t, locale } = useI18n();
  const { hasPermission } = useAuth();
  const { filial } = useFilial();
  const idFilial = useFilialId();
  const podeExcluir = hasPermission(Permissao.PESSOA_GERENCIAR);
  const tituloKey = recurso === "clientes" ? "nav.relatorioClientes" : "nav.relatorioFornecedores";
  const singular = recurso === "clientes" ? t("entity.cliente") : t("entity.fornecedor");
  const [itens, setItens] = useState<Papel[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("ativo");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [folha, setFolha] = useState<FolhaRelatorio | null>(null);

  const resetLista = () => setSelected(null);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    setErro(null);
    setCarregando(true);
    try {
      setItens(await listarPapeis(recurso, idFilial));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, [recurso, idFilial]);

  const q = search.trim().toLowerCase();
  const filtrados = useMemo(() => itens.filter((p) => {
    if (!passaFiltroStatus(p.status, filtroStatus)) return false;
    const doc = p.pessoa.documentos[0];
    const cidade = formatarCidade(cidades, enderecoPrincipal(p.pessoa)?.idCidade ?? null, true);
    const fone = telefoneLinha(p.pessoa);
    return `${p.pessoa.nomeRazaoSocial} ${doc?.numero ?? ""} ${doc?.tipoNome ?? ""} ${fone} ${cidade} ${p.observacao ?? ""}`.toLowerCase().includes(q);
  }), [itens, filtroStatus, cidades, q]);

  const sort = useListSort(filtrados, (p, k) => {
    if (k === "nome") return p.pessoa.nomeRazaoSocial;
    if (k === "documento") return p.pessoa.documentos[0]?.numero ?? "";
    if (k === "telefone") return telefoneLinha(p.pessoa);
    if (k === "cidade") return formatarCidade(cidades, enderecoPrincipal(p.pessoa)?.idCidade ?? null, true);
    if (k === "status") return p.status;
    return p.id;
  }, "nome", "asc");

  useEffect(() => { setPage(1); }, [search, filtroStatus, recurso, sort.sortKey, sort.sortDir]);

  const paged = slicePage(sort.items, page);
  const selecionado = itens.find((p) => p.id === selected) ?? null;
  const navIds = sort.items.map((p) => p.id);
  const navIndex = selected != null ? navIds.indexOf(selected) : -1;

  function linhaDe(p: Papel): string[] {
    const doc = p.pessoa.documentos[0];
    const docNum = doc ? formatarDocumentoExibicao(doc.tipoCodigo, doc.numero) : "—";
    const cidade = formatarCidade(cidades, enderecoPrincipal(p.pessoa)?.idCidade ?? null, true);
    return [
      String(p.id),
      p.pessoa.nomeRazaoSocial,
      docNum,
      telefoneLinha(p.pessoa),
      cidade,
      p.status === "inativo" ? t("common.inactive") : t("common.active"),
      p.observacao?.trim() || "—",
    ];
  }

  function montarFolha(): FolhaRelatorio {
    const empresa = filial?.nome ?? "";
    const situacao = filtroStatus === "inativo" ? t("filter.status.inactive")
      : filtroStatus === "todos" ? t("filter.status.all")
        : t("filter.status.active");
    const colunas = [
      t("col.code"), t("common.name"), t("col.document"), t("ddi.phone"),
      t("col.city"), t("common.status"), t("form.tab.note"),
    ];
    return {
      arquivo: recurso,
      titulo: t(tituloKey),
      empresa,
      filtro: `${empresa} · ${situacao}`,
      emitidoEm: formatarDataHoraEpoch(Date.now(), locale === "es" ? "es-PY" : "pt-BR"),
      faixas: [],
      colunas,
      linhas: sort.items.map(linhaDe),
      direita: [],
      rodapes: [{
        rotulo: tf(t, "relatorio.registros", { n: String(sort.items.length) }),
        celulas: ["", "", "", "", "", "", ""],
      }],
    };
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t(tituloKey)}</h1>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("relatorio.busca.pessoas")}
          className="px-3 py-2 text-sm rounded-md outline-none w-72"
          style={{ background: v("--card"), border: border1(), color: v("--text") }}
        />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm" style={{ color: v("--text-muted") }}>
          {tf(t, "relatorio.registros", { n: String(sort.items.length) })}
        </span>
        <MenuExportar
          disabled={!sort.items.length || carregando}
          onPdf={() => setFolha(montarFolha())}
          onExcel={() => baixarPlanilha(montarFolha())}
        />
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: border1() }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sort.sortKey}
              sortDir={sort.sortDir}
              onSort={sort.onSort}
              cols={[
                { label: "col.code", sort: "id" },
                { label: "common.name", sort: "nome" },
                { label: "col.document", sort: "documento" },
                { label: "ddi.phone", sort: "telefone" },
                { label: "col.city", sort: "cidade" },
                { label: "common.status", sort: "status" },
                { label: "form.tab.note" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((p) => {
              const doc = p.pessoa.documentos[0];
              const docNum = doc ? formatarDocumentoExibicao(doc.tipoCodigo, doc.numero) : "—";
              const cidade = formatarCidade(cidades, enderecoPrincipal(p.pessoa)?.idCidade ?? null, true);
              const fone = telefoneLinha(p.pessoa);
              const nota = p.observacao?.trim() || "";
              const sel = selected === p.id;
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelected(sel ? null : p.id)}
                  className={`drive-row-clickable${sel ? " drive-row-selected" : ""}`}
                >
                  <Td mono gold>{p.id}</Td>
                  <td className="drive-td drive-td-clip text-[0.8125rem] font-medium" style={{ color: v("--text") }} title={p.pessoa.nomeRazaoSocial}>{p.pessoa.nomeRazaoSocial}</td>
                  <Td mono sub clip title={doc ? `${doc.tipoNome} ${docNum}` : undefined}>{docNum}</Td>
                  <Td mono sub clip title={fone !== "—" ? fone : undefined}>{fone}</Td>
                  <Td sub clip title={cidade !== "—" ? cidade : undefined}>{cidade}</Td>
                  <td className="drive-td"><StatusTexto status={p.status} /></td>
                  <Td sub clip title={nota || undefined}>{nota || "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {carregando && !itens.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.loading")}</div>}
        {!carregando && !sort.items.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {sort.items.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>

      {selecionado && (
        <PapelFicha
          item={selecionado}
          recurso={recurso}
          singular={singular}
          cidades={cidades}
          nav={navIndex >= 0 && navIds.length > 1 ? {
            index: navIndex,
            total: navIds.length,
            onPrev: () => { const id = navIds[navIndex - 1]; if (id != null) setSelected(id); },
            onNext: () => { const id = navIds[navIndex + 1]; if (id != null) setSelected(id); },
          } : undefined}
          onClose={() => setSelected(null)}
          onEdit={() => onNavigate(recurso)}
          podeExcluir={podeExcluir}
          onChanged={carregar}
        />
      )}
      {folha && <RelatorioFolha folha={folha} onClose={() => setFolha(null)} />}
    </div>
  );
}
