import { useEffect, useMemo, useState } from "react";
import { ListToolbar, TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useFilialId } from "@/auth/FilialContext";
import { listarMovimentacoesCaixaFilial, type CaixaMovimentacao } from "@/api";
import { dataAsuncion, formatMoeda, formatarDataHoraEpoch, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;

function inicioMes(): string {
  return `${dataAsuncion().slice(0, 8)}01`;
}

function fimMes(): string {
  const iso = dataAsuncion();
  const [ano, mes] = iso.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${iso.slice(0, 8)}${String(ultimo).padStart(2, "0")}`;
}

function datasValidas(de: string, ate: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(de) && /^\d{4}-\d{2}-\d{2}$/.test(ate) && de <= ate;
}

export default function CaixaRelatorioPage({ navReset }: { navReset: number }) {
  const { t, locale } = useI18n();
  const idFilial = useFilialId();
  const [de, setDe] = useState(inicioMes);
  const [ate, setAte] = useState(fimMes);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itens, setItens] = useState<CaixaMovimentacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const reset = () => {
    setDe(inicioMes());
    setAte(fimMes());
    setSearch("");
    setPage(1);
  };
  useCrudReset(navReset, reset);

  useEffect(() => {
    if (!datasValidas(de, ate)) return;
    let cancel = false;
    setCarregando(true);
    listarMovimentacoesCaixaFilial(idFilial, de, ate)
      .then((lista) => { if (!cancel) { setItens(lista); setErro(null); } })
      .catch((e) => { if (!cancel) setErro(mensagemErroApi(e, t, "common.error.loadFailed")); })
      .finally(() => { if (!cancel) setCarregando(false); });
    return () => { cancel = true; };
  }, [idFilial, de, ate, t]);

  useEffect(() => { setPage(1); }, [search, de, ate]);

  const q = search.trim().toLowerCase();
  const filtrados = useMemo(() => itens.filter((m) => {
    const tipo = t(`caixa.mov.${m.tipo}` as TranslationKey);
    const valores = m.finalizadores.map((f) => `${f.finalizadorNome ?? ""} ${f.moeda ?? ""}`).join(" ");
    return `${m.caixaNome ?? ""} ${m.usuarioNome} ${tipo} ${m.observacao ?? ""} ${m.idVenda ?? ""} ${valores}`.toLowerCase().includes(q);
  }), [itens, q, t]);

  const sort = useListSort(filtrados, (e, k) => {
    if (k === "data") return e.criadoEm;
    if (k === "caixa") return e.caixaNome ?? "";
    if (k === "tipo") return e.tipo;
    if (k === "usuario") return e.usuarioNome;
    return e.id;
  }, "data", "desc");
  const paged = slicePage(sort.items, page);
  const dataHora = (ms: number) => formatarDataHoraEpoch(ms, locale === "es" ? "es-PY" : "pt-BR");

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("nav.relatorioCaixa")}</h1>
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("relatorio.busca.caixa")}
          className="px-3 py-2 text-sm rounded-md outline-none w-72"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }}
        />
        <label className="flex items-center gap-2 text-xs" style={{ color: v("--text-muted") }}>
          {t("relatorio.de")}
          <input type="date" className="field" style={{ width: "9.5rem" }} value={de} onChange={(e) => setDe(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-xs" style={{ color: v("--text-muted") }}>
          {t("relatorio.ate")}
          <input type="date" className="field" style={{ width: "9.5rem" }} value={ate} onChange={(e) => setAte(e.target.value)} />
        </label>
        {!datasValidas(de, ate) && <span className="text-xs" style={{ color: "#ef4444" }}>{t("relatorio.periodoInvalido")}</span>}
      </ListToolbar>
      <span className="text-sm" style={{ color: v("--text-muted") }}>{tf(t, "relatorio.registros", { n: String(filtrados.length) })}</span>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.onSort} cols={[
              { label: "col.date", sort: "data" },
              { label: "relatorio.caixa", sort: "caixa" },
              { label: "caixa.movementType", sort: "tipo" },
              { label: "caixa.user", sort: "usuario" },
              { label: "caixa.amount" },
              { label: "caixa.note" },
            ]} />
          </thead>
          <tbody>
            {!carregando && paged.slice.map((m) => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                <Td mono>{dataHora(m.criadoEm)}</Td>
                <Td>{m.caixaNome ?? "—"}</Td>
                <Td>{t(`caixa.mov.${m.tipo}` as TranslationKey)}</Td>
                <Td>{m.usuarioNome}</Td>
                <Td mono>
                  {m.finalizadores.map((f) => `${f.finalizadorNome ?? ""} ${formatMoeda(f.valor, f.moeda ?? "pyg")}`).join(" · ") || "—"}
                  {m.idVenda ? ` · ${t("relatorio.venda")} ${m.idVenda}` : ""}
                </Td>
                <Td sub>{m.observacao ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {!carregando && !filtrados.length && (
          <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>
        )}
        {filtrados.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}
