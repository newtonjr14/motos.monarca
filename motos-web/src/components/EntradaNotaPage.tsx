import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, Section } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import EntradaFicha from "@/components/EntradaFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useFilialId } from "@/auth/FilialContext";
import {
  buscarEntrada,
  criarEntrada,
  listarCaixas,
  listarEntradas,
  listarFinalizadores,
  listarPapeis,
  listarProdutos,
  type Caixa,
  type Entrada,
  type EntradaResumo,
  type Finalizador,
  type Moeda,
  type ModoVencimento,
  type Papel,
  type Produto,
  type TipoDocumentoEntrada,
} from "@/api";
import { formatMoeda, formatPyg, formatarDataIso, slicePage } from "@/format";

const v = (name: string) => `var(${name})`;

type ItemDraft = {
  key: string;
  idProduto: number | "";
  quantidade: string;
  valorUnitario: string;
  chassisTexto: string;
};

type PagDraft = { idFinalizador: number; valor: string; moeda: Moeda };

function hojeIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EntradaNotaPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [itensLista, setItensLista] = useState<EntradaResumo[]>([]);
  const [fornecedores, setFornecedores] = useState<Papel[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [finalizadores, setFinalizadores] = useState<Finalizador[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<Entrada | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoEntrada>("py_factura");
  const [idFornecedor, setIdFornecedor] = useState<number | "">("");
  const [dataEmissao, setDataEmissao] = useState(hojeIso());
  const [moeda, setMoeda] = useState<Moeda>("pyg");
  const [timbrado, setTimbrado] = useState("");
  const [establecimiento, setEstablecimiento] = useState("001");
  const [puntoExpedicion, setPuntoExpedicion] = useState("001");
  const [numero, setNumero] = useState("");
  const [cdc, setCdc] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [incoterm, setIncoterm] = useState("FOB");
  const [itens, setItens] = useState<ItemDraft[]>([{ key: "1", idProduto: "", quantidade: "1", valorUnitario: "", chassisTexto: "" }]);
  const [pagamentos, setPagamentos] = useState<PagDraft[]>([]);
  const [qtdParcelas, setQtdParcelas] = useState("1");
  const [modoVencimento, setModoVencimento] = useState<ModoVencimento>("intervalo_30");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [baixaSessao, setBaixaSessao] = useState<number | "">("");
  const [observacao, setObservacao] = useState("");

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setDetalhe(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      const [ents, pap, prods, fins, cxs] = await Promise.all([
        listarEntradas(idFilial),
        listarPapeis("fornecedores", idFilial),
        listarProdutos(idFilial),
        listarFinalizadores(),
        listarCaixas(idFilial),
      ]);
      setItensLista(ents);
      setFornecedores(pap);
      setProdutos(prods.filter((p) => p.status === "ativo"));
      setFinalizadores(fins.filter((f) => f.status === "ativo" && !f.geraContasReceber));
      setCaixas(cxs);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);

  const filtered = itensLista.filter((e) =>
    `${e.fornecedorNome} ${e.documentoLabel} ${e.tipoDocumento}`.toLowerCase().includes(search.toLowerCase()));
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, (e, k) => {
    if (k === "fornecedor") return e.fornecedorNome;
    if (k === "data") return e.dataEmissao;
    if (k === "valor") return e.valorPyg;
    if (k === "tipo") return e.tipoDocumento;
    return e.criadoEm;
  }, "criadoEm", "desc");
  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

  const navIndex = detalhe ? ordenados.findIndex((e) => e.id === detalhe.id) : -1;
  const produtoMap = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);
  const caixasAbertos = caixas.filter((c) => c.sessaoAbertaId);
  const temPrazo = pagamentos.some((p) => finalizadores.find((f) => f.id === p.idFinalizador)?.geraContasPagar);

  function abrirNovo() {
    setTipoDocumento("py_factura");
    setIdFornecedor("");
    setDataEmissao(hojeIso());
    setMoeda("pyg");
    setTimbrado("");
    setEstablecimiento("001");
    setPuntoExpedicion("001");
    setNumero("");
    setCdc("");
    setNumeroDocumento("");
    setIncoterm("FOB");
    setItens([{ key: String(Date.now()), idProduto: "", quantidade: "1", valorUnitario: "", chassisTexto: "" }]);
    setPagamentos([]);
    setQtdParcelas("1");
    setModoVencimento("intervalo_30");
    setDiaVencimento("10");
    setBaixaSessao(caixasAbertos.find((c) => c.padrao)?.sessaoAbertaId ?? caixasAbertos[0]?.sessaoAbertaId ?? "");
    setObservacao("");
    setErro(null);
    setDetalhe(null);
    setFormAberto(true);
  }

  async function abrirDetalhe(id: number) {
    try {
      setErro(null);
      setDetalhe(await buscarEntrada(id));
      setFormAberto(false);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }

  function toggleFinalizador(f: Finalizador) {
    setPagamentos((prev) => {
      const existe = prev.find((p) => p.idFinalizador === f.id);
      if (existe) return prev.filter((p) => p.idFinalizador !== f.id);
      return [...prev, { idFinalizador: f.id, valor: "", moeda }];
    });
  }

  async function salvar() {
    setErro(null);
    if (idFornecedor === "") {
      setErro(t("titulo.error.fornecedor"));
      return;
    }
    const itensBody = itens.map((i) => {
      const prod = i.idProduto === "" ? null : produtoMap.get(i.idProduto);
      const chassis = i.chassisTexto.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
      return {
        idProduto: i.idProduto === "" ? 0 : i.idProduto,
        quantidade: prod?.controlaChassi ? 0 : (Number.parseInt(i.quantidade, 10) || 0),
        valorUnitario: Number(i.valorUnitario.replace(",", ".")) || 0,
        numerosChassis: prod?.controlaChassi ? chassis : [],
      };
    }).filter((i) => i.idProduto > 0);
    if (itensBody.length === 0) {
      setErro(t("entrada.error.itens"));
      return;
    }
    if (pagamentos.length === 0) {
      setErro(t("entrada.error.pagamento"));
      return;
    }
    setSalvando(true);
    try {
      await criarEntrada({
        idFilial,
        idFornecedor,
        tipoDocumento,
        dataEmissao,
        moeda,
        idCaixaSessao: baixaSessao === "" ? null : baixaSessao,
        timbrado: tipoDocumento === "py_factura" ? timbrado.trim() || null : null,
        establecimiento: tipoDocumento === "py_factura" ? establecimiento.trim() || null : null,
        puntoExpedicion: tipoDocumento === "py_factura" ? puntoExpedicion.trim() || null : null,
        numero: tipoDocumento === "py_factura" ? numero.trim() || null : null,
        cdc: tipoDocumento === "py_factura" ? cdc.trim() || null : null,
        numeroDocumento: tipoDocumento === "exterior" ? numeroDocumento.trim() || null : null,
        incoterm: tipoDocumento === "exterior" ? incoterm.trim() || null : null,
        itens: itensBody,
        negociacao: pagamentos.map((p) => ({
          idFinalizador: p.idFinalizador,
          valor: Number(p.valor.replace(",", ".")) || 0,
          moeda: p.moeda,
        })),
        parcelas: temPrazo ? {
          quantidade: Number.parseInt(qtdParcelas, 10) || 1,
          modoVencimento,
          diaVencimento: modoVencimento === "dia_fixo" ? (Number.parseInt(diaVencimento, 10) || 10) : null,
        } : null,
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
      <div className="space-y-5 max-w-3xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>{t("entrada.new")}</h1>
        <form className="rounded-lg p-6 space-y-5" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

          <Section title={t("entrada.documento")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("entrada.tipoDocumento")} required>
                <select className="field" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as TipoDocumentoEntrada)}>
                  <option value="py_factura">{t("entrada.tipo.py_factura")}</option>
                  <option value="exterior">{t("entrada.tipo.exterior")}</option>
                </select>
              </Field>
              <Field label={t("nav.fornecedores")} required>
                <select className="field" value={idFornecedor === "" ? "" : String(idFornecedor)}
                  onChange={(e) => setIdFornecedor(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">{t("common.select")}</option>
                  {fornecedores.filter((c) => c.status === "ativo").map((c) => (
                    <option key={c.id} value={c.id}>{c.pessoa.nomeRazaoSocial}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("entrada.dataEmissao")} required>
                <input className="field" type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
              </Field>
              <Field label={t("titulo.moeda")} required>
                <select className="field" value={moeda} onChange={(e) => setMoeda(e.target.value as Moeda)}>
                  <option value="pyg">Gs.</option>
                  <option value="usd">US$</option>
                  <option value="brl">R$</option>
                </select>
              </Field>
            </div>
            {tipoDocumento === "py_factura" ? (
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <Field label={t("entrada.timbrado")} required>
                  <input className="field font-mono" value={timbrado} onChange={(e) => setTimbrado(e.target.value)} />
                </Field>
                <Field label={t("entrada.establecimiento")} required>
                  <input className="field font-mono" value={establecimiento} onChange={(e) => setEstablecimiento(e.target.value)} />
                </Field>
                <Field label={t("entrada.punto")} required>
                  <input className="field font-mono" value={puntoExpedicion} onChange={(e) => setPuntoExpedicion(e.target.value)} />
                </Field>
                <Field label={t("entrada.numero")} required>
                  <input className="field font-mono" value={numero} onChange={(e) => setNumero(e.target.value)} />
                </Field>
                <Field label={t("entrada.cdc")}>
                  <input className="field font-mono" value={cdc} onChange={(e) => setCdc(e.target.value)} maxLength={44} placeholder="44 dígitos (opcional)" />
                </Field>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <Field label={t("entrada.numeroDocumento")} required>
                  <input className="field font-mono" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
                </Field>
                <Field label={t("entrada.incoterm")}>
                  <input className="field" value={incoterm} onChange={(e) => setIncoterm(e.target.value)} />
                </Field>
              </div>
            )}
          </Section>

          <Section title={t("entrada.itens")}>
            <div className="space-y-3">
              {itens.map((item, idx) => {
                const prod = item.idProduto === "" ? null : produtoMap.get(item.idProduto);
                return (
                  <div key={item.key} className="rounded-md p-3 space-y-2" style={{ background: v("--card2"), border: `1px solid ${v("--border")}` }}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label={t("nav.produtos")} required>
                        <select className="field" value={item.idProduto === "" ? "" : String(item.idProduto)}
                          onChange={(e) => {
                            const id = e.target.value ? Number(e.target.value) : "";
                            setItens((prev) => prev.map((x, i) => i === idx ? { ...x, idProduto: id } : x));
                          }}>
                          <option value="">{t("common.select")}</option>
                          {produtos.map((p) => (
                            <option key={p.id} value={p.id}>{p.codigo} — {p.nome}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label={t("entrada.valorUnitario")} required>
                        <input className="field font-mono" value={item.valorUnitario}
                          onChange={(e) => setItens((prev) => prev.map((x, i) => i === idx ? { ...x, valorUnitario: e.target.value } : x))} />
                      </Field>
                    </div>
                    {prod?.controlaChassi ? (
                      <Field label={t("entrada.chassisHint")} required>
                        <textarea className="field font-mono min-h-[72px]" value={item.chassisTexto}
                          placeholder="HD5…647~HD5…696"
                          onChange={(e) => setItens((prev) => prev.map((x, i) => i === idx ? { ...x, chassisTexto: e.target.value } : x))} />
                      </Field>
                    ) : (
                      <Field label={t("venda.qty")} required>
                        <input className="field" value={item.quantidade}
                          onChange={(e) => setItens((prev) => prev.map((x, i) => i === idx ? { ...x, quantidade: e.target.value.replace(/\D/g, "") } : x))} />
                      </Field>
                    )}
                    {itens.length > 1 && (
                      <button type="button" className="text-xs cursor-pointer" style={{ color: v("--danger") }}
                        onClick={() => setItens((prev) => prev.filter((_, i) => i !== idx))}>
                        {t("common.delete")}
                      </button>
                    )}
                  </div>
                );
              })}
              <button type="button" className="btn-ghost px-3 py-1.5 text-sm"
                onClick={() => setItens((prev) => [...prev, { key: String(Date.now()), idProduto: "", quantidade: "1", valorUnitario: "", chassisTexto: "" }])}>
                + {t("entrada.addItem")}
              </button>
            </div>
          </Section>

          <Section title={t("venda.pay")}>
            <div className="flex flex-wrap gap-2 mb-3">
              {finalizadores.map((f) => {
                const ativo = pagamentos.some((p) => p.idFinalizador === f.id);
                return (
                  <button key={f.id} type="button"
                    className="px-3 py-1.5 text-xs rounded-md cursor-pointer"
                    style={{
                      background: ativo ? v("--gold-bg") : v("--card2"),
                      color: ativo ? v("--gold") : v("--text-sub"),
                      border: `1px solid ${ativo ? v("--gold-border") : v("--border")}`,
                    }}
                    onClick={() => toggleFinalizador(f)}>
                    {f.nome}{f.geraContasPagar ? ` (${t("entrada.prazo")})` : ""}
                  </button>
                );
              })}
            </div>
            {pagamentos.map((p) => (
              <div key={p.idFinalizador} className="grid gap-2 sm:grid-cols-3 mb-2">
                <p className="text-sm self-center" style={{ color: v("--text") }}>
                  {finalizadores.find((f) => f.id === p.idFinalizador)?.nome}
                </p>
                <Field label={t("titulo.moeda")}>
                  <select className="field" value={p.moeda}
                    onChange={(e) => setPagamentos((prev) => prev.map((x) => x.idFinalizador === p.idFinalizador ? { ...x, moeda: e.target.value as Moeda } : x))}>
                    <option value="pyg">Gs.</option>
                    <option value="usd">US$</option>
                    <option value="brl">R$</option>
                  </select>
                </Field>
                <Field label={t("titulo.valor")}>
                  <input className="field font-mono" value={p.valor}
                    onChange={(e) => setPagamentos((prev) => prev.map((x) => x.idFinalizador === p.idFinalizador ? { ...x, valor: e.target.value } : x))} />
                </Field>
              </div>
            ))}
            {temPrazo && (
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
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
              </div>
            )}
            {pagamentos.some((p) => !finalizadores.find((f) => f.id === p.idFinalizador)?.geraContasPagar) && (
              <Field label={t("nav.caixa")}>
                <select className="field" value={baixaSessao === "" ? "" : String(baixaSessao)}
                  onChange={(e) => setBaixaSessao(e.target.value ? Number(e.target.value) : "")}>
                  {caixasAbertos.map((c) => (
                    <option key={c.id} value={c.sessaoAbertaId!}>{c.nome}</option>
                  ))}
                </select>
              </Field>
            )}
          </Section>

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
      <CatalogHeader titulo={t("nav.entradaNota")} novoLabel={t("entrada.new")} onNovo={abrirNovo} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("entrada.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
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
                { label: "entrada.tipoDocumento", sort: "tipo" },
                { label: "entrada.dataEmissao", sort: "data" },
                { label: "titulo.valor", sort: "valor" },
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((e) => (
              <tr key={e.id} className="drive-row-clickable" onClick={() => void abrirDetalhe(e.id)}>
                <Td>{e.fornecedorNome}</Td>
                <Td sub>{t(`entrada.tipo.${e.tipoDocumento}` as TranslationKey)} · {e.documentoLabel || "—"}</Td>
                <Td sub>{formatarDataIso(e.dataEmissao)}</Td>
                <Td mono right>{formatMoeda(e.valor, e.moeda)} · {formatPyg(e.valorPyg)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} total={ordenados.length} onPageChange={setPage} />

      {detalhe && (
        <EntradaFicha
          item={detalhe}
          nav={navIndex >= 0 ? {
            index: navIndex,
            total: ordenados.length,
            onPrev: () => { const prev = ordenados[navIndex - 1]; if (prev) void abrirDetalhe(prev.id); },
            onNext: () => { const next = ordenados[navIndex + 1]; if (next) void abrirDetalhe(next.id); },
          } : undefined}
          onClose={() => setDetalhe(null)}
        />
      )}
    </div>
  );
}
