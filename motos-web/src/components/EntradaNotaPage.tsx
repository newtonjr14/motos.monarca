import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Field, Section } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, TableHeadRow, TablePagination, Td, useListSort } from "@/components/crud/ListUi";
import EntradaFicha from "@/components/EntradaFicha";
import F2InsideHint from "@/components/F2InsideHint";
import SearchPickerModal from "@/components/SearchPickerModal";
import { useCotacaoHoje } from "@/components/CotacaoBanner";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useFilialId } from "@/auth/FilialContext";
import {
  buscarEntrada,
  criarEntrada,
  listarAdiantamentos,
  listarCaixas,
  listarEntradas,
  listarFinalizadores,
  listarPapeis,
  listarProdutos,
  type AdiantamentoFornecedor,
  type Caixa,
  type Cotacao,
  type Entrada,
  type EntradaResumo,
  type Finalizador,
  type Moeda,
  type ModoVencimento,
  type Papel,
  type Produto,
  type TipoDocumentoEntrada,
} from "@/api";
import { CHASSI_MAXIMO, dePyg, expandirNumerosChassi, formatMoeda, formatPyg, formatarDataEpoch, formatarDataIso, MOEDAS, paraPyg, quitaSaldoNaMoeda, slicePage, toleranciaFechamentoPyg } from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

function parseValor(valor: string): number {
  return Number(valor.replace(",", ".")) || 0;
}

function chassisDaLinha(texto: string): { numeros: string[]; erro?: "CHASSI_INTERVALO_INVALIDO" | "CHASSI_INTERVALO_GRANDE" | "CHASSI_DUPLICADO"; duplicado?: string } {
  const exp = expandirNumerosChassi(texto);
  if (!exp.ok) return { numeros: [], erro: exp.codigo };
  const seen = new Set<string>();
  for (const n of exp.numeros) {
    if (seen.has(n)) return { numeros: exp.numeros, erro: "CHASSI_DUPLICADO", duplicado: n };
    seen.add(n);
  }
  return { numeros: exp.numeros };
}

function resumoChassis(numeros: string[]): string {
  if (numeros.length <= 1) return numeros[0] ?? "";
  return `${numeros[0]} → ${numeros[numeros.length - 1]}`;
}

function formatarValorMoeda(pyg: number, moeda: Moeda, cotacao: Cotacao | null): string {
  if (pyg <= 0) return "";
  if (moeda === "pyg") return String(Math.round(pyg));
  const raw = dePyg(pyg, moeda, cotacao);
  if (!Number.isFinite(raw) || raw <= 0) return "";
  return raw.toFixed(2);
}

function somarMeses(data: Date, meses: number, dia: number): Date {
  const base = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(dia, ultimo));
  return base;
}

function preverParcelas(
  total: number,
  qtd: number,
  modo: ModoVencimento,
  dia: number,
  moeda: Moeda,
): { numero: number; vencimento: Date; valor: number }[] {
  if (qtd < 1) return [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const arred = (n: number) => (moeda === "pyg" ? Math.round(n) : Math.round(n * 100) / 100);
  const unidade = arred(total / qtd);
  const partes = Array.from({ length: qtd }, () => unidade);
  const soma = partes.reduce((a, n) => a + n, 0);
  partes[qtd - 1] = arred(partes[qtd - 1]! + (total - soma));
  const diaFixo = Math.min(28, Math.max(1, dia || 1));
  let ancora = somarMeses(hoje, 0, diaFixo);
  if (hoje.getTime() >= ancora.getTime()) ancora = somarMeses(ancora, 1, diaFixo);
  return partes.map((valor, i) => ({
    numero: i + 1,
    valor,
    vencimento: modo === "intervalo_30"
      ? new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30 * (i + 1))
      : somarMeses(ancora, i, diaFixo),
  }));
}

type ItemDraft = {
  key: string;
  idProduto: number | "";
  quantidade: string;
  valorUnitario: string;
  chassisTexto: string;
};

type PagDraft = { idFinalizador: number; valor: string; moeda: Moeda; idCaixaMovimentacao?: number };

function hojeIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EntradaNotaPage({ navReset }: { navReset: number }) {
  const { t, locale } = useI18n();
  const { cotacao } = useCotacaoHoje();
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
  const [itens, setItens] = useState<ItemDraft[]>([]);
  const [itemAberto, setItemAberto] = useState(false);
  const [itemEditKey, setItemEditKey] = useState<string | null>(null);
  const [itemProduto, setItemProduto] = useState<number | "">("");
  const [itemValor, setItemValor] = useState("");
  const [itemQtd, setItemQtd] = useState("1");
  const [itemChassis, setItemChassis] = useState("");
  const [listaProduto, setListaProduto] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [itemErro, setItemErro] = useState<string | null>(null);
  const [pagamentos, setPagamentos] = useState<PagDraft[]>([]);
  const [definindo, setDefinindo] = useState(false);
  const [defId, setDefId] = useState<number | "">("");
  const [defMoeda, setDefMoeda] = useState<Moeda>("pyg");
  const [defValor, setDefValor] = useState("");
  const [adiantamentos, setAdiantamentos] = useState<AdiantamentoFornecedor[]>([]);
  const [defAdiantamento, setDefAdiantamento] = useState<number | "">("");
  const [listaFinalizador, setListaFinalizador] = useState(false);
  const [buscaFinalizador, setBuscaFinalizador] = useState("");
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
      setFinalizadores(fins.filter((f) => f.status === "ativo" && !f.geraContasReceber && !f.geraCreditoCliente));
      setCaixas(cxs);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);

  useEffect(() => {
    if (!formAberto || idFornecedor === "") {
      setAdiantamentos([]);
      return;
    }
    let vivo = true;
    listarAdiantamentos(idFilial, idFornecedor)
      .then((lista) => { if (vivo) setAdiantamentos(lista); })
      .catch(() => { if (vivo) setAdiantamentos([]); });
    return () => { vivo = false; };
  }, [formAberto, idFornecedor, idFilial]);

  useEffect(() => {
    if (!definindo) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || listaFinalizador) return;
      e.preventDefault();
      setDefinindo(false);
      setErro(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [definindo, listaFinalizador]);

  useEffect(() => {
    if (!itemAberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || listaProduto) return;
      e.preventDefault();
      setItemAberto(false);
      setItemErro(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [itemAberto, listaProduto]);

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
  const temPrazo = pagamentos.some((p) => p.idCaixaMovimentacao == null && finalizadores.find((f) => f.id === p.idFinalizador)?.geraContasPagar);

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
    setItens([]);
    setItemAberto(false);
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

  function valorLinha(item: ItemDraft): number {
    const prod = item.idProduto === "" ? null : produtoMap.get(item.idProduto);
    const unit = parseValor(item.valorUnitario);
    const qtd = prod?.controlaChassi
      ? chassisDaLinha(item.chassisTexto).numeros.length
      : (Number.parseInt(item.quantidade, 10) || 0);
    return unit * qtd;
  }

  const totalDoc = itens.reduce((s, item) => s + valorLinha(item), 0);
  const totalPyg = paraPyg(totalDoc, moeda, cotacao);
  const pagoPyg = pagamentos.reduce((s, p) => s + paraPyg(parseValor(p.valor), p.moeda, cotacao), 0);
  const falta = totalPyg - pagoPyg;
  const tolerancia = toleranciaFechamentoPyg(cotacao);
  const quitado = totalPyg > 0 && falta <= tolerancia;
  const prodItem = itemProduto === "" ? null : produtoMap.get(itemProduto) ?? null;
  const loteItem = prodItem?.controlaChassi ? chassisDaLinha(itemChassis) : null;
  const erroLote = loteItem ? mensagemChassis(loteItem) : null;

  function abrirItem(item?: ItemDraft) {
    setItemEditKey(item?.key ?? null);
    setItemProduto(item?.idProduto ?? "");
    setItemValor(item?.valorUnitario ?? "");
    setItemQtd(item?.quantidade || "1");
    setItemChassis(item?.chassisTexto ?? "");
    setBuscaProduto("");
    setListaProduto(false);
    setItemErro(null);
    setItemAberto(true);
  }

  function mensagemChassis(lote: ReturnType<typeof chassisDaLinha>): string | null {
    if (lote.erro === "CHASSI_INTERVALO_GRANDE") return tf(t, "api.CHASSI_INTERVALO_GRANDE", { max: String(CHASSI_MAXIMO) });
    if (lote.erro === "CHASSI_INTERVALO_INVALIDO") return t("produto.error.chassiIntervalo");
    if (lote.erro === "CHASSI_DUPLICADO") return tf(t, "api.CHASSI_DUPLICADO", { chassi: lote.duplicado ?? "" });
    return null;
  }

  function confirmarItem() {
    if (itemProduto === "") {
      setItemErro(t("entrada.error.produto"));
      return;
    }
    const prod = produtoMap.get(itemProduto);
    const unit = parseValor(itemValor);
    if (unit <= 0) {
      setItemErro(t("entrada.error.valor"));
      return;
    }
    let chassisTexto = "";
    let quantidade = "1";
    if (prod?.controlaChassi) {
      const lote = chassisDaLinha(itemChassis);
      const msg = mensagemChassis(lote);
      if (msg) {
        setItemErro(msg);
        return;
      }
      if (lote.numeros.length === 0) {
        setItemErro(t("api.UNIDADE_OBRIGATORIA"));
        return;
      }
      const outros = itens
        .filter((i) => i.key !== itemEditKey)
        .flatMap((i) => chassisDaLinha(i.chassisTexto).numeros);
      const repetido = lote.numeros.find((n) => outros.includes(n));
      if (repetido) {
        setItemErro(tf(t, "entrada.chassiRepetido", { chassi: repetido }));
        return;
      }
      chassisTexto = itemChassis.trim().toUpperCase();
    } else {
      const qtd = Number.parseInt(itemQtd, 10) || 0;
      if (qtd <= 0) {
        setItemErro(t("entrada.error.qtd"));
        return;
      }
      quantidade = String(qtd);
    }
    const linha: ItemDraft = {
      key: itemEditKey ?? String(Date.now()),
      idProduto: itemProduto,
      quantidade,
      valorUnitario: itemValor.trim(),
      chassisTexto,
    };
    setItens((atual) => itemEditKey
      ? atual.map((i) => i.key === itemEditKey ? linha : i)
      : [...atual, linha]);
    setItemAberto(false);
    setItemErro(null);
  }

  function abrirDefinir() {
    const rest = Math.max(0, falta);
    const inicial: Moeda = moeda !== "pyg" && cotacao ? moeda : "pyg";
    setDefMoeda(inicial);
    setDefValor(formatarValorMoeda(rest, inicial, cotacao));
    setDefId("");
    setDefAdiantamento("");
    setBuscaFinalizador("");
    setDefinindo(true);
    setErro(null);
  }

  function mudarDefMoeda(proxima: Moeda) {
    if (defAdiantamento !== "") return;
    if (proxima !== "pyg" && !cotacao) return;
    const informado = parseValor(defValor);
    const saldo = Math.max(0, falta);
    const pyg = quitaSaldoNaMoeda(informado, defMoeda, saldo, cotacao)
      ? saldo
      : paraPyg(informado, defMoeda, cotacao);
    setDefMoeda(proxima);
    setDefValor(formatarValorMoeda(pyg || saldo, proxima, cotacao));
  }

  function escolherAdiantamento(id: number | "") {
    setDefAdiantamento(id);
    if (id === "") return;
    const item = adiantamentos.find((a) => a.id === id);
    if (!item) return;
    setDefId(item.idFinalizador);
    setDefMoeda(item.moeda);
    const saldoMoeda = Math.max(0, dePyg(Math.max(0, falta), item.moeda, cotacao));
    const usar = Math.min(item.valorAberto, saldoMoeda > 0 ? saldoMoeda : item.valorAberto);
    setDefValor(formatarValorMoeda(paraPyg(usar, item.moeda, cotacao), item.moeda, cotacao));
  }

  function confirmarDefinir() {
    if (defId === "") {
      setErro(t("venda.error.pay"));
      return;
    }
    const fin = finalizadores.find((f) => f.id === defId);
    const pyg = Math.round(paraPyg(parseValor(defValor), defMoeda, cotacao));
    if (pyg <= 0) {
      setErro(t("venda.error.pay"));
      return;
    }
    const avancado = defAdiantamento === "" ? null : adiantamentos.find((a) => a.id === defAdiantamento);
    if (defAdiantamento !== "" && !avancado) {
      setErro(t("api.ADIANTAMENTO_INVALIDO"));
      return;
    }
    if (avancado) {
      const ja = pagamentos
        .filter((p) => p.idCaixaMovimentacao === avancado.id)
        .reduce((soma, p) => soma + parseValor(p.valor), 0);
      if (parseValor(defValor) + ja > avancado.valorAberto + 0.009) {
        setErro(t("api.ADIANTAMENTO_EXCEDIDO"));
        return;
      }
    }
    const jaPrazo = pagamentos.some((p) => p.idCaixaMovimentacao == null && finalizadores.find((f) => f.id === p.idFinalizador)?.geraContasPagar);
    if (!avancado && fin?.geraContasPagar && jaPrazo) {
      setErro(t("api.ENTRADA_CREDITO_UNICO"));
      return;
    }
    if (pyg > Math.max(0, falta) + tolerancia) {
      setErro(t("venda.payOver"));
      return;
    }
    if (!avancado && fin?.geraContasPagar) {
      const qtd = Number.parseInt(qtdParcelas, 10) || 0;
      const dia = Number.parseInt(diaVencimento, 10) || 0;
      if (qtd < 1 || qtd > 120) {
        setErro(t("api.PARCELAS_QTD"));
        return;
      }
      if (modoVencimento === "dia_fixo" && (dia < 1 || dia > 28)) {
        setErro(t("api.DIA_VENCIMENTO_INVALIDO"));
        return;
      }
    }
    setPagamentos((atual) => [...atual, {
      idFinalizador: defId,
      moeda: defMoeda,
      valor: defValor,
      idCaixaMovimentacao: defAdiantamento === "" ? undefined : defAdiantamento,
    }]);
    setDefinindo(false);
    setErro(null);
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
          idCaixaMovimentacao: p.idCaixaMovimentacao ?? null,
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
    const finDefinindo = finalizadores.find((f) => f.id === defId);
    const geraParcelas = defAdiantamento === "" && Boolean(finDefinindo?.geraContasPagar);
    const qtdParcelasN = Number.parseInt(qtdParcelas, 10) || 0;
    const parcelasPreview = geraParcelas && parseValor(defValor) > 0 && qtdParcelasN >= 1
      ? preverParcelas(parseValor(defValor), qtdParcelasN, modoVencimento, Number.parseInt(diaVencimento, 10) || 10, defMoeda)
      : [];
    const temVista = pagamentos.some((p) => p.idCaixaMovimentacao == null && !finalizadores.find((f) => f.id === p.idFinalizador)?.geraContasPagar);
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
                  onChange={(e) => {
                    const next = e.target.value ? Number(e.target.value) : "";
                    setIdFornecedor(next);
                    setPagamentos((atual) => atual.filter((p) => p.idCaixaMovimentacao == null));
                  }}>
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
            {itens.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: v("--text-muted") }}>{t("entrada.itensEmpty")}</p>
            ) : (
              <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${v("--border")}` }}>
                <table className="drive-table w-full">
                  <thead>
                    <tr>
                      <th className="drive-th">{t("nav.produtos")}</th>
                      <th className="drive-th drive-th-right">{t("venda.qty")}</th>
                      <th className="drive-th drive-th-right">{t("entrada.valorUnitario")}</th>
                      <th className="drive-th drive-th-right">{t("entrada.total")}</th>
                      <th className="drive-th w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => {
                      const prod = item.idProduto === "" ? null : produtoMap.get(item.idProduto);
                      const lote = prod?.controlaChassi ? chassisDaLinha(item.chassisTexto) : null;
                      const qtd = lote ? lote.numeros.length : (Number.parseInt(item.quantidade, 10) || 0);
                      return (
                        <tr key={item.key} className="drive-row-clickable" onClick={() => abrirItem(item)}>
                          <td className="drive-td">
                            <p className="text-sm" style={{ color: v("--text") }}>{prod ? `${prod.codigo} — ${prod.nome}` : ""}</p>
                            {lote && lote.numeros.length > 0 && (
                              <p className="text-[11px] font-mono" style={{ color: v("--text-muted") }}>
                                {resumoChassis(lote.numeros)}
                                {lote.numeros.length > 1 ? ` · ${tf(t, "produto.chassiCount", { n: String(lote.numeros.length) })}` : ""}
                              </p>
                            )}
                          </td>
                          <Td mono right>{qtd}</Td>
                          <Td mono right>{formatMoeda(parseValor(item.valorUnitario), moeda)}</Td>
                          <Td mono right>{formatMoeda(valorLinha(item), moeda)}</Td>
                          <td className="drive-td text-right">
                            <button type="button" className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                              onClick={(e) => { e.stopPropagation(); setItens((prev) => prev.filter((x) => x.key !== item.key)); }}>
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" className="btn-gold px-4 py-2 text-sm mt-3" onClick={() => abrirItem()}>
              {t("entrada.addItem")}
            </button>
          </Section>

          <Section title={t("venda.pay")}>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--text-muted") }}>{t("venda.total")}</p>
                <p className="font-mono text-sm" style={{ color: v("--text") }}>{formatMoeda(totalDoc, moeda)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--text-muted") }}>{t("venda.paid")}</p>
                <p className="font-mono text-sm" style={{ color: v("--text") }}>{formatMoeda(dePyg(pagoPyg, moeda, cotacao), moeda)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--text-muted") }}>{t("venda.remainingValue")}</p>
                <p className="font-mono text-sm" style={{ color: quitado ? "var(--success)" : v("--gold") }}>
                  {formatMoeda(dePyg(Math.max(0, falta), moeda, cotacao), moeda)}
                </p>
              </div>
            </div>
            {pagamentos.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: v("--text-muted") }}>{t("venda.payEmpty")}</p>
            ) : (
              <table className="pdv-pay-table">
                <thead>
                  <tr>
                    <th>{t("venda.pay")}</th>
                    <th>{t("venda.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((p, idx) => {
                    const fin = finalizadores.find((f) => f.id === p.idFinalizador);
                    const qtd = p.idCaixaMovimentacao == null && fin?.geraContasPagar ? (Number.parseInt(qtdParcelas, 10) || 0) : 0;
                    const tag = p.idCaixaMovimentacao != null ? ` · ${t("entrada.adiantamento.tag")}` : "";
                    return (
                      <tr key={`${p.idFinalizador}-${idx}`}>
                        <td>{fin?.nome ?? ""}{qtd >= 1 ? ` ${qtd}x` : ""}{tag}</td>
                        <td className="font-mono">
                          {formatMoeda(parseValor(p.valor), p.moeda)}
                          <button type="button" className="ml-3 text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                            onClick={() => setPagamentos((atual) => atual.filter((_, i) => i !== idx))}>
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!quitado && (
              <button type="button" className="btn-gold px-4 py-2 text-sm mt-3" onClick={abrirDefinir}>
                {t("venda.definePay")}
              </button>
            )}
            {temVista && (
              <div className="mt-3">
                <Field label={t("nav.caixa")}>
                  <select className="field" value={baixaSessao === "" ? "" : String(baixaSessao)}
                    onChange={(e) => setBaixaSessao(e.target.value ? Number(e.target.value) : "")}>
                    {caixasAbertos.map((c) => (
                      <option key={c.id} value={c.sessaoAbertaId!}>{c.nome}</option>
                    ))}
                  </select>
                </Field>
              </div>
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
        {itemAberto && createPortal(
          <div
            className="pdv-def-overlay"
            onClick={() => { setItemAberto(false); setItemErro(null); }}
            role="dialog"
            aria-modal="true"
            aria-label={itemEditKey ? t("common.edit") : t("entrada.addItem")}
          >
            <div className={prodItem?.controlaChassi ? "pdv-def-dialog is-chassi" : "pdv-def-dialog"} onClick={(e) => e.stopPropagation()}>
              <div className="pdv-def-head">
                <h2 className="pdv-cart-title">{itemEditKey ? t("common.edit") : t("entrada.addItem")}</h2>
                <button
                  type="button"
                  onClick={() => { setItemAberto(false); setItemErro(null); }}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-lg leading-none"
                  style={{ color: v("--text-muted"), background: v("--card2"), border: border1() }}
                  aria-label={t("ficha.close")}
                >
                  ×
                </button>
              </div>
              <div className="pdv-def-body">
                {itemErro && <p className="text-sm" style={{ color: "#ef4444" }}>{itemErro}</p>}
                <div>
                  <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("nav.produtos")}</p>
                  <button
                    type="button"
                    className="field flex items-center justify-between gap-2 text-left cursor-pointer"
                    onClick={() => { setBuscaProduto(""); setListaProduto(true); }}
                    onKeyDown={(e) => {
                      if (e.key !== "F2") return;
                      e.preventDefault();
                      setBuscaProduto("");
                      setListaProduto(true);
                    }}
                  >
                    <span className="truncate" style={{ color: itemProduto === "" ? v("--text-muted") : v("--text") }}>
                      {prodItem ? `${prodItem.codigo} — ${prodItem.nome}` : t("venda.productSearch")}
                    </span>
                    <F2InsideHint />
                  </button>
                </div>
                <Field label={t("entrada.valorUnitario")} required>
                  <input
                    className="field font-mono"
                    inputMode="decimal"
                    value={itemValor}
                    onChange={(e) => setItemValor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !prodItem?.controlaChassi) {
                        e.preventDefault();
                        confirmarItem();
                      }
                    }}
                  />
                </Field>
                {prodItem?.controlaChassi ? (
                  <Field
                    label={t("produto.chassiLote")}
                    required
                    hint={erroLote ? undefined : t("produto.chassiLoteHint")}
                    error={erroLote ?? undefined}
                    aside={!erroLote && loteItem && loteItem.numeros.length > 0 ? tf(t, "produto.chassiCount", { n: String(loteItem.numeros.length) }) : undefined}
                  >
                    <textarea
                      className="field font-mono uppercase"
                      rows={5}
                      value={itemChassis}
                      placeholder={t("produto.chassiLotePlaceholder")}
                      onChange={(e) => setItemChassis(e.target.value.toUpperCase())}
                    />
                    {!erroLote && loteItem && loteItem.numeros.length > 1 && (
                      <p className="mt-1 text-xs font-mono" style={{ color: v("--text-muted") }}>{resumoChassis(loteItem.numeros)}</p>
                    )}
                  </Field>
                ) : (
                  <Field label={t("venda.qty")} required>
                    <input
                      className="field font-mono"
                      inputMode="numeric"
                      value={itemQtd}
                      onChange={(e) => setItemQtd(e.target.value.replace(/\D/g, "").slice(0, 7))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          confirmarItem();
                        }
                      }}
                    />
                  </Field>
                )}
                <div className="flex items-baseline justify-between">
                  <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--text-muted") }}>{t("entrada.total")}</p>
                  <p className="font-mono text-sm" style={{ color: v("--text") }}>
                    {formatMoeda(
                      parseValor(itemValor) * (prodItem?.controlaChassi
                        ? (loteItem && !loteItem.erro ? loteItem.numeros.length : 0)
                        : (Number.parseInt(itemQtd, 10) || 0)),
                      moeda,
                    )}
                  </p>
                </div>
              </div>
              <div className="pdv-def-foot">
                <button type="button" className="text-xs cursor-pointer px-3 py-2" style={{ color: v("--text-muted") }}
                  onClick={() => { setItemAberto(false); setItemErro(null); }}>
                  {t("common.cancel")}
                </button>
                <button type="button" className="btn-gold px-4 py-2 text-sm" onClick={confirmarItem}>
                  {t("venda.confirmPay")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
        {definindo && createPortal(
          <div
            className="pdv-def-overlay"
            onClick={() => { setDefinindo(false); setErro(null); }}
            role="dialog"
            aria-modal="true"
            aria-label={t("venda.definePay")}
          >
            <div className={geraParcelas ? "pdv-def-dialog is-parcelas" : "pdv-def-dialog"} onClick={(e) => e.stopPropagation()}>
              <div className="pdv-def-head">
                <div>
                  <h2 className="pdv-cart-title">{t("venda.definePay")}</h2>
                  {geraParcelas && (
                    <p className="text-xs mt-0.5" style={{ color: v("--text-muted") }}>{finDefinindo?.nome}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setDefinindo(false); setErro(null); }}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-lg leading-none"
                  style={{ color: v("--text-muted"), background: v("--card2"), border: border1() }}
                  aria-label={t("ficha.close")}
                >
                  ×
                </button>
              </div>
              <div className={geraParcelas ? "pdv-def-body is-parcelas" : "pdv-def-body"}>
                {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
                <div className="pdv-def-pay">
                  {adiantamentos.length > 0 && (
                    <div className="pdv-def-span">
                      <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("entrada.adiantamento")}</p>
                      <select className="field" value={defAdiantamento === "" ? "" : String(defAdiantamento)}
                        onChange={(e) => escolherAdiantamento(e.target.value ? Number(e.target.value) : "")}>
                        <option value="">{t("entrada.adiantamento.nenhum")}</option>
                        {adiantamentos.map((a) => (
                          <option key={a.id} value={a.id}>
                            {formatarDataEpoch(a.criadoEm)} · {a.finalizadorNome} · {formatMoeda(a.valorAberto, a.moeda)}
                            {a.observacao ? ` · ${a.observacao}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("venda.pay")}</p>
                    <button
                      type="button"
                      className="field flex items-center justify-between gap-2 text-left cursor-pointer"
                      disabled={defAdiantamento !== ""}
                      onClick={() => { setBuscaFinalizador(""); setListaFinalizador(true); }}
                      onKeyDown={(e) => {
                        if (e.key !== "F2" || defAdiantamento !== "") return;
                        e.preventDefault();
                        setBuscaFinalizador("");
                        setListaFinalizador(true);
                      }}
                    >
                      <span className="truncate" style={{ color: defId === "" ? v("--text-muted") : v("--text") }}>
                        {defId === "" ? t("venda.finalizerSearch") : (finDefinindo?.nome ?? "")}
                      </span>
                      <F2InsideHint />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("venda.remainingValue")}</p>
                    <p className="field font-mono" style={{ color: v("--text") }}>
                      {formatMoeda(dePyg(Math.max(0, falta), defMoeda, cotacao), defMoeda)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MOEDAS.map((m) => {
                      const ativo = defMoeda === m;
                      const bloqueada = m !== "pyg" && !cotacao;
                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={bloqueada || defAdiantamento !== ""}
                          className="pdv-pay px-2 py-1.5 text-xs rounded-md cursor-pointer"
                          style={{
                            background: ativo ? "var(--gold-bg)" : v("--card"),
                            border: ativo ? `1px solid ${v("--gold-border")}` : border1(),
                            color: ativo ? v("--gold") : v("--text-sub"),
                            opacity: bloqueada ? 0.45 : 1,
                          }}
                          onClick={() => mudarDefMoeda(m)}
                        >
                          {m === "pyg" ? t("venda.currency.pyg") : m === "brl" ? t("venda.currency.brl") : t("venda.currency.usd")}
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("venda.payAmount")}</p>
                    <input
                      className="field font-mono"
                      inputMode="decimal"
                      value={defValor}
                      onFocus={(e) => e.currentTarget.select()}
                      onMouseUp={(e) => e.preventDefault()}
                      onChange={(e) => setDefValor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          confirmarDefinir();
                        }
                      }}
                    />
                  </div>
                  {defMoeda !== "pyg" && paraPyg(parseValor(defValor), defMoeda, cotacao) > 0 && (
                    <p className="pdv-def-span text-xs font-mono" style={{ color: v("--text-muted") }}>
                      {tf(t, "venda.equivalent", { n: formatPyg(paraPyg(parseValor(defValor), defMoeda, cotacao)) })}
                    </p>
                  )}
                </div>
                {geraParcelas && (
                  <div className="pdv-def-parcelas">
                    <div className="pdv-def-parcelas-form">
                      <p className="text-xs font-medium" style={{ color: v("--text") }}>{t("venda.parcelas")}</p>
                      <Field label={t("venda.qtdParcelas")}>
                        <input className="field" inputMode="numeric" value={qtdParcelas}
                          onChange={(e) => setQtdParcelas(e.target.value.replace(/\D/g, ""))} />
                      </Field>
                      <Field label={t("venda.modoVencimento")}>
                        <select className="field" value={modoVencimento}
                          onChange={(e) => setModoVencimento(e.target.value as ModoVencimento)}>
                          <option value="intervalo_30">{t("venda.modo.intervalo30")}</option>
                          <option value="dia_fixo">{t("venda.modo.diaFixo")}</option>
                        </select>
                      </Field>
                      {modoVencimento === "dia_fixo" && (
                        <Field label={t("venda.diaVencimento")}>
                          <input className="field" inputMode="numeric" value={diaVencimento}
                            onChange={(e) => setDiaVencimento(e.target.value.replace(/\D/g, "").slice(0, 2))} />
                        </Field>
                      )}
                    </div>
                    <div className="pdv-def-parcelas-table">
                      <table className="pdv-pay-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>{t("venda.due")}</th>
                            <th>{t("venda.amount")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parcelasPreview.length === 0 ? (
                            <tr>
                              <td colSpan={3} style={{ color: v("--text-muted") }}>{t("venda.parcelasEmpty")}</td>
                            </tr>
                          ) : parcelasPreview.map((p) => (
                            <tr key={p.numero}>
                              <td>{p.numero}</td>
                              <td>{p.vencimento.toLocaleDateString(locale === "pt" ? "pt-BR" : "es-PY")}</td>
                              <td className="font-mono">{formatMoeda(p.valor, defMoeda)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="pdv-def-foot">
                <button type="button" className="text-xs cursor-pointer px-3 py-2" style={{ color: v("--text-muted") }}
                  onClick={() => { setDefinindo(false); setErro(null); }}>
                  {t("common.cancel")}
                </button>
                <button type="button" className="btn-gold px-4 py-2 text-sm" onClick={confirmarDefinir}>
                  {t("venda.confirmPay")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
        <SearchPickerModal
          open={listaFinalizador}
          title={t("venda.pay")}
          searchPlaceholder={t("venda.finalizerSearch")}
          query={buscaFinalizador}
          onQueryChange={setBuscaFinalizador}
          items={finalizadores
            .filter((f) => {
              const q = buscaFinalizador.trim().toLowerCase();
              return !q || f.nome.toLowerCase().includes(q);
            })
            .map((f) => ({
              id: String(f.id),
              label: f.geraContasPagar ? `${f.nome} (${t("entrada.prazo")})` : f.nome,
              selected: defId === f.id,
            }))}
          onPick={(id) => { setDefId(Number(id)); setListaFinalizador(false); setBuscaFinalizador(""); }}
          onClose={() => { setListaFinalizador(false); setBuscaFinalizador(""); }}
        />
        <SearchPickerModal
          open={listaProduto}
          title={t("nav.produtos")}
          searchPlaceholder={t("produto.searchPlaceholder")}
          query={buscaProduto}
          onQueryChange={setBuscaProduto}
          items={produtos
            .filter((p) => {
              const q = buscaProduto.trim().toLowerCase();
              if (!q) return true;
              return `${p.codigo} ${p.nome} ${p.marca} ${p.modelo}`.toLowerCase().includes(q);
            })
            .map((p) => ({
              id: String(p.id),
              label: `${p.codigo} — ${p.nome}`,
              selected: itemProduto === p.id,
            }))}
          onPick={(id) => {
            const next = Number(id);
            const prod = produtoMap.get(next);
            setItemProduto(next);
            if (prod?.controlaChassi) setItemQtd("1");
            else setItemChassis("");
            setListaProduto(false);
            setBuscaProduto("");
            setItemErro(null);
          }}
          onClose={() => { setListaProduto(false); setBuscaProduto(""); }}
        />
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
