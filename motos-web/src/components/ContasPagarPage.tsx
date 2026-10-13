import { useCallback, useEffect, useState } from "react";
import { Field } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, TableHeadRow, TablePagination, Td, TituloFiltro, passaFiltroTitulo, useListSort, type FiltroTitulo } from "@/components/crud/ListUi";
import TituloFicha, { chaveStatusLista, guaraniDoSaldo, linhasParcelaLista, textoCotacaoTitulo } from "@/components/TituloFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useFilialId } from "@/auth/FilialContext";
import {
  buscarTituloPagar,
  criarTituloPagar,
  listarCaixas,
  listarFinalizadores,
  listarPapeis,
  listarTitulosPagar,
  type Caixa,
  type Finalizador,
  type Moeda,
  type ModoVencimento,
  type Papel,
  type TituloPagar,
  type TituloPagarResumo,
} from "@/api";
import { formatMoeda, formatarDataIso, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;

export default function ContasPagarPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [itens, setItens] = useState<TituloPagarResumo[]>([]);
  const [fornecedores, setFornecedores] = useState<Papel[]>([]);
  const [finalizadores, setFinalizadores] = useState<Finalizador[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [search, setSearch] = useState("");
  const [filtroTitulo, setFiltroTitulo] = useState<FiltroTitulo>("abertos");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<TituloPagar | null>(null);
  const [idFornecedor, setIdFornecedor] = useState<number | "">("");
  const [moeda, setMoeda] = useState<Moeda>("pyg");
  const [valor, setValor] = useState("");
  const [qtdParcelas, setQtdParcelas] = useState("1");
  const [modoVencimento, setModoVencimento] = useState<ModoVencimento>("intervalo_30");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setDetalhe(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      const [titulos, pap, fins, cxs] = await Promise.all([
        listarTitulosPagar(idFilial),
        listarPapeis("fornecedores", idFilial),
        listarFinalizadores(),
        listarCaixas(idFilial),
      ]);
      setItens(titulos);
      setFornecedores(pap);
      setFinalizadores(fins.filter((f) => !f.geraContasReceber && !f.geraContasPagar && f.status === "ativo"));
      setCaixas(cxs);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);

  const linhas = itens.flatMap((e) => linhasParcelaLista(e.fornecedorNome, e));
  const filtered = linhas.filter((e) =>
    passaFiltroTitulo(e.status, filtroTitulo) &&
    `${e.pessoaNome} ${e.numero ?? ""} ${e.status}`.toLowerCase().includes(search.toLowerCase()));
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (e, k) => {
    if (k === "fornecedor") return e.pessoaNome;
    if (k === "parcela") return e.numero ?? 0;
    if (k === "vencimento") return e.vencimento ?? "";
    if (k === "cotacao") return textoCotacaoTitulo(e.moeda, e.usdPyg, e.brlPyg);
    if (k === "guarani") return guaraniDoSaldo(e.saldo, e.moeda, e.usdPyg, e.brlPyg);
    if (k === "status") return e.status;
    return e.vencimento ?? "";
  }, "vencimento", "asc");
  useEffect(() => { setPage(1); }, [search, filtroTitulo, sortKey, sortDir]);

  const titulosNav = ordenados.reduce<number[]>((ids, e) => {
    if (!ids.includes(e.tituloId)) ids.push(e.tituloId);
    return ids;
  }, []);
  const navIndex = detalhe ? titulosNav.findIndex((id) => id === detalhe.id) : -1;

  function abrirNovo() {
    setIdFornecedor("");
    setMoeda("pyg");
    setValor("");
    setQtdParcelas("1");
    setModoVencimento("intervalo_30");
    setDiaVencimento("10");
    setObservacao("");
    setErro(null);
    setDetalhe(null);
    setFormAberto(true);
  }

  async function abrirDetalhe(id: number) {
    try {
      setErro(null);
      setDetalhe(await buscarTituloPagar(id));
      setFormAberto(false);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }

  async function salvar() {
    setErro(null);
    if (idFornecedor === "") {
      setErro(t("titulo.error.fornecedor"));
      return;
    }
    const vlr = Number(valor.replace(",", ".")) || 0;
    const qtd = Number.parseInt(qtdParcelas, 10) || 0;
    if (vlr <= 0) {
      setErro(t("titulo.error.valor"));
      return;
    }
    if (qtd < 1) {
      setErro(t("api.PARCELAS_QTD"));
      return;
    }
    setSalvando(true);
    try {
      await criarTituloPagar({
        idFilial,
        idFornecedor,
        moeda,
        valor: vlr,
        parcelas: {
          quantidade: qtd,
          modoVencimento,
          diaVencimento: modoVencimento === "dia_fixo" ? (Number.parseInt(diaVencimento, 10) || 10) : null,
        },
        observacao: observacao.trim() || null,
      });
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
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("titulo.pagar.new")}</h1>
        <form className="rounded-lg p-6 space-y-4" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <Field label={t("nav.fornecedores")} required>
            <select className="field" value={idFornecedor === "" ? "" : String(idFornecedor)}
              onChange={(e) => setIdFornecedor(e.target.value ? Number(e.target.value) : "")}>
              <option value="">{t("common.select")}</option>
              {fornecedores.filter((c) => c.status === "ativo").map((c) => (
                <option key={c.id} value={c.id}>{c.pessoa.nomeRazaoSocial}</option>
              ))}
            </select>
          </Field>
          <Field label={t("titulo.moeda")} required>
            <select className="field" value={moeda} onChange={(e) => setMoeda(e.target.value as Moeda)}>
              <option value="pyg">Gs.</option>
              <option value="usd">US$</option>
              <option value="brl">R$</option>
            </select>
          </Field>
          <Field label={t("titulo.valor")} required>
            <input className="field font-mono" value={valor} onChange={(e) => setValor(e.target.value)} />
          </Field>
          <Field label={t("venda.qtdParcelas")} required>
            <input className="field" value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label={t("venda.modoVencimento")}>
            <select className="field" value={modoVencimento} onChange={(e) => setModoVencimento(e.target.value as ModoVencimento)}>
              <option value="intervalo_30">{t("venda.modo.intervalo30")}</option>
              <option value="dia_fixo">{t("venda.modo.diaFixo")}</option>
            </select>
          </Field>
          {modoVencimento === "dia_fixo" && (
            <Field label={t("venda.diaVencimento")}>
              <input className="field" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </Field>
          )}
          <Field label={t("caixa.note")}>
            <input className="field" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            <button type="submit" className="btn-gold px-5 py-2 text-sm" disabled={salvando}>{salvando ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  const paged = slicePage(ordenados, page);

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.contasPagar")} novoLabel={t("titulo.pagar.new")} onNovo={abrirNovo} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("titulo.searchPlaceholderPagar")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
        <TituloFiltro value={filtroTitulo} onChange={setFiltroTitulo} />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "nav.fornecedores", sort: "fornecedor" },
                { label: "titulo.parc", sort: "parcela" },
                { label: "titulo.vencimento", sort: "vencimento" },
                { label: "titulo.cotacao", sort: "cotacao" },
                { label: "titulo.valorNominal", align: "right" },
                { label: "titulo.valorAberto", align: "right" },
                { label: "titulo.abertoGuarani", sort: "guarani", align: "right" },
                { label: "common.status", sort: "status" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.parcelaId} className="drive-row-clickable" onClick={() => void abrirDetalhe(e.tituloId)}>
                <Td>{e.pessoaNome}</Td>
                <Td mono>{e.numero ?? "—"}</Td>
                <Td sub>{e.vencimento ? formatarDataIso(e.vencimento) : "—"}</Td>
                <Td mono>{textoCotacaoTitulo(e.moeda, e.usdPyg, e.brlPyg)}</Td>
                <Td mono right>{formatMoeda(e.valor, e.moeda)}</Td>
                <Td mono right>{formatMoeda(e.saldo, e.moeda)}</Td>
                <Td mono right>{formatMoeda(guaraniDoSaldo(e.saldo, e.moeda, e.usdPyg, e.brlPyg), "pyg")}</Td>
                <Td>{t(chaveStatusLista(e.status))}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-2 text-xs" style={{ color: v("--text-muted"), borderTop: `1px solid ${v("--border")}` }}>
          {t("titulo.cotacaoLegenda")}
        </p>
      </div>
      <TablePagination page={page} total={ordenados.length} onPageChange={setPage} />

      {detalhe && (
        <TituloFicha
          modo="pagar"
          item={detalhe}
          finalizadores={finalizadores}
          caixas={caixas}
          nav={navIndex >= 0 ? {
            index: navIndex,
            total: titulosNav.length,
            onPrev: () => { const prev = titulosNav[navIndex - 1]; if (prev) void abrirDetalhe(prev); },
            onNext: () => { const next = titulosNav[navIndex + 1]; if (next) void abrirDetalhe(next); },
          } : undefined}
          onClose={() => setDetalhe(null)}
          onUpdated={async (atualizado) => {
            setDetalhe(atualizado as TituloPagar);
            await carregar();
          }}
        />
      )}
    </div>
  );
}
