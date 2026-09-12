import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EquivalentesMoeda from "@/components/EquivalentesMoeda";
import { Field } from "@/components/crud/Field";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useAuth } from "@/auth/AuthContext";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import {
  buscarCotacaoHoje,
  criarVenda,
  listarCaixas,
  listarFinalizadores,
  listarPapeis,
  listarProdutos,
  listarUnidades,
  listarVendedoresVenda,
  type Caixa,
  type Cotacao,
  type Finalizador,
  type Moeda,
  type Papel,
  type Produto,
  type ProdutoUnidade,
  type TipoProduto,
  type VendedorOpcao,
} from "@/api";
import {
  converterMoeda,
  formatarDocumentoExibicao,
  formatMoeda,
  formatPyg,
  moedaOperacaoDe,
  normalizarChassi,
  paraPyg,
  dePyg,
} from "@/format";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

type UnidadeDraft = { id: number; numero: string };
type ItemDraft = { idProduto: number; quantidade: number; unidades: UnidadeDraft[] };
type PagDraft = { idFinalizador: number; moeda: Moeda; valor: string };
type FiltroTipo = "todos" | TipoProduto;
const MOEDAS: Moeda[] = ["pyg", "usd", "brl"];
const VITRINE_LIMITE = 24;
const VITRINE_BUSCA = 48;

function estoqueDe(p: Produto): number {
  return p.quantidadeDisponivel ?? 0;
}

function formatarValorMoeda(pyg: number, moeda: Moeda, cotacao: Cotacao | null): string {
  if (pyg <= 0) return "";
  if (moeda === "pyg") return String(Math.round(pyg));
  const raw = dePyg(pyg, moeda, cotacao);
  if (!Number.isFinite(raw) || raw <= 0) return "";
  return raw.toFixed(2);
}

function parseGs(valor: string): number {
  return Number(valor.replace(",", ".")) || 0;
}

function textoCliente(c: Papel): string {
  const docs = c.pessoa.documentos.map((d) => `${d.tipoNome} ${d.numero}`).join(" ");
  return `${c.pessoa.nomeRazaoSocial} ${c.pessoa.email ?? ""} ${c.pessoa.telefone ?? ""} ${docs}`;
}

function docCliente(c: Papel): string | null {
  const doc = c.pessoa.documentos[0];
  if (!doc) return null;
  return `${doc.tipoNome} ${formatarDocumentoExibicao(doc.tipoCodigo, doc.numero)}`;
}

function textoProduto(p: Produto): string {
  return `${p.codigo} ${p.nome} ${p.marca} ${p.modelo}`;
}

export default function VendasPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Papel[]>([]);
  const [finalizadores, setFinalizadores] = useState<Finalizador[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    try {
      setErro(null);
      const [prods, clis, fins, cxs] = await Promise.all([
        listarProdutos(idFilial),
        listarPapeis("clientes", idFilial),
        listarFinalizadores(),
        listarCaixas(idFilial, true),
      ]);
      setProdutos(prods.filter((p) => p.status === "ativo" && p.precoLista > 0));
      setClientes(clis.filter((c) => c.status === "ativo"));
      setFinalizadores(fins.filter((f) => f.status === "ativo"));
      setCaixas(cxs);
      try { setCotacao(await buscarCotacaoHoje()); } catch { setCotacao(null); }
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);

  return (
    <div>
      {erro && <p className="text-sm mb-3" style={{ color: "#ef4444" }}>{erro}</p>}
      <VendaForm
        idFilial={idFilial}
        produtos={produtos}
        clientes={clientes}
        finalizadores={finalizadores}
        caixas={caixas}
        cotacao={cotacao}
        navReset={navReset}
        onSaved={carregar}
      />
    </div>
  );
}

function VendaForm({
  idFilial, produtos, clientes, finalizadores, caixas, cotacao, navReset, onSaved,
}: {
  idFilial: number;
  produtos: Produto[];
  clientes: Papel[];
  finalizadores: Finalizador[];
  caixas: Caixa[];
  cotacao: Cotacao | null;
  navReset: number;
  onSaved: () => Promise<void>;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { filial } = useFilial();
  const moedaOp = moedaOperacaoDe(filial?.moedaOperacao);
  const caixasAbertos = caixas.filter((c) => c.sessaoAbertaId);
  const [idCliente, setIdCliente] = useState<number | "">("");
  const [idVendedor, setIdVendedor] = useState<number | "">(user?.id ?? "");
  const [vendedores, setVendedores] = useState<VendedorOpcao[]>([]);
  const [idSessao, setIdSessao] = useState<number | "">("");
  const [linhas, setLinhas] = useState<ItemDraft[]>([]);
  const [pagamentos, setPagamentos] = useState<PagDraft[]>([]);
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [passo, setPasso] = useState<"itens" | "pagamento">("itens");

  const [buscaCliente, setBuscaCliente] = useState("");
  const [listaCliente, setListaCliente] = useState(false);
  const [buscaVendedor, setBuscaVendedor] = useState("");
  const [listaVendedor, setListaVendedor] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const produtoRef = useRef<HTMLInputElement>(null);
  const clienteRef = useRef<HTMLInputElement>(null);
  const carrinhoRef = useRef<HTMLDivElement>(null);
  const chassiRef = useRef<HTMLInputElement>(null);
  const [pickingId, setPickingId] = useState<number | null>(null);
  const [unidadesDisp, setUnidadesDisp] = useState<ProdutoUnidade[]>([]);
  const [buscaChassi, setBuscaChassi] = useState("");
  const [carregandoChassi, setCarregandoChassi] = useState(false);

  const cliente = idCliente === "" ? undefined : clientes.find((c) => c.id === idCliente);
  const vendedor = idVendedor === ""
    ? undefined
    : vendedores.find((vdd) => vdd.id === idVendedor)
      ?? (user && user.id === idVendedor ? { id: user.id, nome: user.nome } : undefined);
  const caixaAtual = caixasAbertos.find((c) => c.sessaoAbertaId === idSessao);

  const limparCarrinho = useCallback(() => {
    setLinhas([]);
    setPagamentos([]);
    setObservacao("");
    setErro(null);
    setBuscaProduto("");
    setPasso("itens");
    setPickingId(null);
    setUnidadesDisp([]);
    setBuscaChassi("");
    produtoRef.current?.focus();
  }, []);
  useCrudReset(navReset, limparCarrinho);

  useEffect(() => {
    void listarVendedoresVenda(idFilial)
      .then(setVendedores)
      .catch(() => setVendedores([]));
  }, [idFilial]);

  useEffect(() => {
    setIdSessao((atual) => {
      if (atual !== "" && caixas.some((c) => c.sessaoAbertaId === atual)) return atual;
      return caixas.find((c) => c.padrao && c.sessaoAbertaId)?.sessaoAbertaId
        ?? caixas.find((c) => c.sessaoAbertaId)?.sessaoAbertaId
        ?? "";
    });
  }, [caixas]);

  const totalPyg = useMemo(() => linhas.reduce((acc, linha) => {
    const p = produtos.find((x) => x.id === linha.idProduto);
    if (!p) return acc;
    return acc + paraPyg(p.precoLista, p.moedaPreco, cotacao) * linha.quantidade;
  }, 0), [linhas, produtos, cotacao]);

  const pago = pagamentos.reduce((acc, p) => acc + paraPyg(parseGs(p.valor), p.moeda, cotacao), 0);
  const falta = Math.round(totalPyg - pago);

  useEffect(() => {
    setPagamentos((atual) => {
      if (atual.length !== 1) return atual;
      const unico = atual[0]!;
      if (unico.moeda !== "pyg") return atual;
      const alvo = totalPyg > 0 ? String(Math.round(totalPyg)) : "";
      return unico.valor === alvo ? atual : [{ ...unico, valor: alvo }];
    });
  }, [totalPyg]);

  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.trim().toLowerCase();
    const base = q ? clientes.filter((c) => textoCliente(c).toLowerCase().includes(q)) : clientes;
    return base.slice(0, 8);
  }, [clientes, buscaCliente]);

  const vendedoresFiltrados = useMemo(() => {
    const q = buscaVendedor.trim().toLowerCase();
    const base = q ? vendedores.filter((vdd) => vdd.nome.toLowerCase().includes(q)) : vendedores;
    return base.slice(0, 8);
  }, [vendedores, buscaVendedor]);

  const produtosVitrine = useMemo(() => {
    const q = buscaProduto.trim().toLowerCase();
    const filtrados = produtos.filter((p) => {
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
      if (!q) return true;
      return textoProduto(p).toLowerCase().includes(q);
    });
    const ordenados = [...filtrados].sort((a, b) => {
      const ea = estoqueDe(a);
      const eb = estoqueDe(b);
      if ((ea > 0) !== (eb > 0)) return ea > 0 ? -1 : 1;
      if (eb !== ea) return eb - ea;
      return a.nome.localeCompare(b.nome, "pt");
    });
    const limite = q ? VITRINE_BUSCA : VITRINE_LIMITE;
    return { itens: ordenados.slice(0, limite), total: ordenados.length };
  }, [produtos, buscaProduto, filtroTipo]);

  const idsUsados = useMemo(
    () => new Set(linhas.flatMap((l) => l.unidades.map((u) => u.id))),
    [linhas],
  );
  const produtoPicking = pickingId != null ? produtos.find((p) => p.id === pickingId) : undefined;
  const chassisFiltrados = useMemo(() => {
    const q = normalizarChassi(buscaChassi);
    return unidadesDisp
      .filter((u) => !idsUsados.has(u.id) && (!q || u.numero.includes(q)))
      .slice(0, 80);
  }, [unidadesDisp, idsUsados, buscaChassi]);

  async function abrirPicker(id: number) {
    setPickingId(id);
    setBuscaChassi("");
    setCarregandoChassi(true);
    setErro(null);
    try {
      setUnidadesDisp(await listarUnidades(id, idFilial, "disponivel"));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
      setUnidadesDisp([]);
    } finally {
      setCarregandoChassi(false);
      requestAnimationFrame(() => chassiRef.current?.focus());
    }
  }

  function fecharPicker() {
    setPickingId(null);
    setBuscaChassi("");
    setUnidadesDisp([]);
    produtoRef.current?.focus();
  }

  function adicionarUnidade(u: ProdutoUnidade) {
    if (idsUsados.has(u.id)) {
      setErro(t("api.UNIDADE_REPETIDA"));
      return;
    }
    setLinhas((lista) => {
      const i = lista.findIndex((l) => l.idProduto === u.idProduto);
      const nova = { id: u.id, numero: u.numero };
      if (i >= 0) {
        const linha = lista[i]!;
        const unidades = [...linha.unidades, nova];
        return [{ ...linha, unidades, quantidade: unidades.length }, ...lista.filter((_, idx) => idx !== i)];
      }
      return [{ idProduto: u.idProduto, quantidade: 1, unidades: [nova] }, ...lista];
    });
    setBuscaChassi("");
    setErro(null);
    requestAnimationFrame(() => {
      chassiRef.current?.focus();
      if (carrinhoRef.current) carrinhoRef.current.scrollTop = 0;
    });
  }

  function tentarChassi() {
    const q = normalizarChassi(buscaChassi);
    const disponiveis = unidadesDisp.filter((u) => !idsUsados.has(u.id));
    if (q) {
      const usado = unidadesDisp.find((u) => u.numero === q && idsUsados.has(u.id));
      if (usado) {
        setErro(t("api.UNIDADE_REPETIDA"));
        return;
      }
      const exato = disponiveis.find((u) => u.numero === q);
      if (exato) {
        adicionarUnidade(exato);
        return;
      }
    }
    const first = chassisFiltrados[0];
    if (first) adicionarUnidade(first);
    else setErro(t("venda.noChassis"));
  }

  function lancarProduto(id: number) {
    const p = produtos.find((x) => x.id === id);
    if (!p) {
      setErro(t("venda.error.product"));
      return;
    }
    if (p.controlaChassi) {
      setBuscaProduto("");
      void abrirPicker(id);
      return;
    }
    const atual = linhas.find((l) => l.idProduto === id);
    const next = (atual?.quantidade ?? 0) + 1;
    if (p.quantidadeDisponivel != null && next > p.quantidadeDisponivel) {
      setErro(t("venda.error.qty"));
      return;
    }
    setLinhas((lista) => {
      const i = lista.findIndex((l) => l.idProduto === id);
      if (i >= 0) {
        const linha = { ...lista[i]!, quantidade: next };
        return [linha, ...lista.filter((_, idx) => idx !== i)];
      }
      return [{ idProduto: id, quantidade: 1, unidades: [] }, ...lista];
    });
    setBuscaProduto("");
    setErro(null);
    produtoRef.current?.focus();
    requestAnimationFrame(() => { carrinhoRef.current && (carrinhoRef.current.scrollTop = 0); });
  }

  function alterarQtd(idProduto: number, delta: number) {
    const atual = linhas.find((l) => l.idProduto === idProduto);
    if (!atual) return;
    const p = produtos.find((x) => x.id === idProduto);
    if (p?.controlaChassi || atual.unidades.length > 0) {
      if (delta > 0) {
        void abrirPicker(idProduto);
        return;
      }
      const unidades = atual.unidades.slice(0, -1);
      if (unidades.length === 0) {
        setLinhas((lista) => lista.filter((l) => l.idProduto !== idProduto));
      } else {
        setLinhas((lista) => lista.map((l) => l.idProduto === idProduto ? { ...l, unidades, quantidade: unidades.length } : l));
      }
      setErro(null);
      return;
    }
    const next = atual.quantidade + delta;
    if (next <= 0) {
      setLinhas((lista) => lista.filter((l) => l.idProduto !== idProduto));
      setErro(null);
      return;
    }
    if (p?.quantidadeDisponivel != null && next > p.quantidadeDisponivel) {
      setErro(t("venda.error.qty"));
      return;
    }
    setLinhas((lista) => lista.map((l) => l.idProduto === idProduto ? { ...l, quantidade: next } : l));
    setErro(null);
  }

  function escolherFinalizador(id: number) {
    const linhasPag = pagamentos.filter((p) => p.idFinalizador === id);
    if (linhasPag.length === 0) {
      const rest = Math.max(0, Math.round(totalPyg - pago));
      setPagamentos((atual) => [...atual, { idFinalizador: id, moeda: "pyg", valor: rest > 0 ? String(rest) : "" }]);
      setErro(null);
      return;
    }
    const usadas = new Set(linhasPag.map((p) => p.moeda));
    const proxima = MOEDAS.find((m) => !usadas.has(m) && (m === "pyg" || cotacao));
    if (proxima) {
      const rest = Math.max(0, totalPyg - pago);
      setPagamentos((atual) => [...atual, {
        idFinalizador: id,
        moeda: proxima,
        valor: formatarValorMoeda(rest, proxima, cotacao),
      }]);
      setErro(null);
      return;
    }
    if (pagamentos.length > 1) {
      setPagamentos((atual) => atual.filter((p) => p.idFinalizador !== id));
    }
  }

  function mudarMoeda(idx: number, moeda: Moeda) {
    if (moeda !== "pyg" && !cotacao) return;
    setPagamentos((atual) => {
      const alvo = atual[idx];
      if (!alvo) return atual;
      if (atual.some((p, i) => i !== idx && p.idFinalizador === alvo.idFinalizador && p.moeda === moeda)) {
        return atual;
      }
      const pyg = paraPyg(parseGs(alvo.valor), alvo.moeda, cotacao);
      return atual.map((p, i) => i === idx
        ? { ...p, moeda, valor: formatarValorMoeda(pyg || Math.max(0, totalPyg - (pago - pyg)), moeda, cotacao) }
        : p);
    });
  }

  function escolherCliente(id: number) {
    setIdCliente(id);
    setListaCliente(false);
    setBuscaCliente("");
    produtoRef.current?.focus();
  }

  async function salvar() {
    setErro(null);
    if (idCliente === "") {
      setErro(t("venda.error.client"));
      clienteRef.current?.focus();
      return;
    }
    if (idVendedor === "") {
      setErro(t("venda.error.seller"));
      return;
    }
    if (!linhas.length) {
      setErro(t("venda.error.items"));
      return;
    }
    if (linhas.some((l) => {
      const p = produtos.find((x) => x.id === l.idProduto);
      return Boolean(p?.controlaChassi) && l.unidades.length === 0;
    })) {
      setErro(t("venda.error.chassisRequired"));
      setPasso("itens");
      return;
    }
    const negociacao = pagamentos
      .map((p) => ({ idFinalizador: p.idFinalizador, moeda: p.moeda, valor: parseGs(p.valor) }))
      .filter((p) => p.valor > 0);
    if (!negociacao.length) {
      setErro(t("venda.error.pay"));
      return;
    }
    const pagoPyg = negociacao.reduce((a, p) => a + paraPyg(p.valor, p.moeda, cotacao), 0);
    if (Math.abs(pagoPyg - totalPyg) > 1) {
      setErro(t("api.VENDA_NEGOCIACAO_DIVERGENTE"));
      return;
    }
    setSalvando(true);
    try {
      await criarVenda({
        idFilial,
        idCliente,
        idVendedor,
        idCaixaSessao: idSessao === "" ? null : idSessao,
        itens: linhas.map((l) => ({
          idProduto: l.idProduto,
          quantidade: l.quantidade,
          idsUnidades: l.unidades.map((u) => u.id),
        })),
        negociacao,
        observacao: observacao.trim() || null,
      });
      limparCarrinho();
      await onSaved();
      produtoRef.current?.focus();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  const qtdItens = linhas.reduce((acc, l) => acc + l.quantidade, 0);
  const podePagar = idCliente !== "" && idVendedor !== "" && linhas.length > 0;
  const podeFinalizar = podePagar && falta === 0 && pagamentos.some((p) => parseGs(p.valor) > 0);

  function irParaPagamento() {
    setErro(null);
    if (idCliente === "") {
      setErro(t("venda.error.client"));
      clienteRef.current?.focus();
      return;
    }
    if (idVendedor === "") {
      setErro(t("venda.error.seller"));
      return;
    }
    if (!linhas.length) {
      setErro(t("venda.error.items"));
      return;
    }
    if (linhas.some((l) => {
      const p = produtos.find((x) => x.id === l.idProduto);
      return Boolean(p?.controlaChassi) && l.unidades.length === 0;
    })) {
      setErro(t("venda.error.chassisRequired"));
      return;
    }
    setPasso("pagamento");
  }

  return (
    <div className="pdv-page">
      {erro && <p className="text-sm mb-2 shrink-0" style={{ color: "#ef4444" }}>{erro}</p>}

      <div className="pdv-top">
        <div className="pdv-chip">
          <span className="pdv-chip-label">{t("venda.client")}</span>
          {cliente && !listaCliente ? (
            <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
              <span className="pdv-chip-value truncate">{cliente.pessoa.nomeRazaoSocial}</span>
              <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: v("--gold") }}
                onClick={() => { setListaCliente(true); setBuscaCliente(""); setTimeout(() => clienteRef.current?.focus(), 0); }}>
                {t("venda.changeClient")}
              </button>
            </div>
          ) : (
            <div className="relative flex-1 min-w-0">
              <input
                ref={clienteRef}
                className="pdv-chip-input"
                autoFocus
                value={buscaCliente}
                placeholder={t("venda.clientSearchPlaceholder")}
                onChange={(e) => { setBuscaCliente(e.target.value); setListaCliente(true); }}
                onFocus={() => setListaCliente(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const first = clientesFiltrados[0];
                    if (first) escolherCliente(first.id);
                  } else if (e.key === "Escape") {
                    setListaCliente(false);
                  }
                }}
              />
              {listaCliente && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setListaCliente(false)} />
                  <ul className="absolute left-0 right-0 mt-1 z-30 rounded-md shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                    style={{ background: v("--card"), border: border1() }}>
                    {clientesFiltrados.map((c) => (
                      <li key={c.id}>
                        <button type="button" className="w-full text-left px-3 py-2 cursor-pointer"
                          onClick={() => escolherCliente(c.id)}>
                          <span className="block text-sm" style={{ color: v("--text") }}>{c.pessoa.nomeRazaoSocial}</span>
                          {docCliente(c) && <span className="block text-xs font-mono" style={{ color: v("--text-muted") }}>{docCliente(c)}</span>}
                        </button>
                      </li>
                    ))}
                    {clientesFiltrados.length === 0 && (
                      <li className="px-3 py-2 text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</li>
                    )}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        <div className="pdv-chip">
          <span className="pdv-chip-label">{t("venda.seller")}</span>
          {vendedor && !listaVendedor ? (
            <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
              <span className="pdv-chip-value truncate">{vendedor.nome}</span>
              <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: v("--gold") }}
                onClick={() => { setListaVendedor(true); setBuscaVendedor(""); }}>
                {t("venda.changeSeller")}
              </button>
            </div>
          ) : (
            <div className="relative flex-1 min-w-0">
              <input
                className="pdv-chip-input"
                value={buscaVendedor}
                placeholder={t("venda.sellerSearchPlaceholder")}
                onChange={(e) => { setBuscaVendedor(e.target.value); setListaVendedor(true); }}
                onFocus={() => setListaVendedor(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const first = vendedoresFiltrados[0];
                    if (first) {
                      setIdVendedor(first.id);
                      setListaVendedor(false);
                      setBuscaVendedor("");
                    }
                  } else if (e.key === "Escape") {
                    setListaVendedor(false);
                    setBuscaVendedor("");
                  }
                }}
              />
              {listaVendedor && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => { setListaVendedor(false); setBuscaVendedor(""); }} />
                  <ul className="absolute left-0 right-0 mt-1 z-30 rounded-md shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                    style={{ background: v("--card"), border: border1() }}>
                    {vendedoresFiltrados.map((vdd) => (
                      <li key={vdd.id}>
                        <button type="button" className="w-full text-left px-3 py-2 cursor-pointer"
                          onClick={() => { setIdVendedor(vdd.id); setListaVendedor(false); setBuscaVendedor(""); }}>
                          <span className="block text-sm" style={{ color: v("--text") }}>{vdd.nome}</span>
                        </button>
                      </li>
                    ))}
                    {vendedoresFiltrados.length === 0 && (
                      <li className="px-3 py-2 text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</li>
                    )}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        <div className="pdv-chip">
          <span className="pdv-chip-label">{t("venda.till")}</span>
          {caixasAbertos.length ? (
            <select className="pdv-chip-input" value={idSessao} onChange={(e) => setIdSessao(e.target.value ? Number(e.target.value) : "")}>
              <option value="">{t("common.select")}</option>
              {caixasAbertos.map((c) => (
                <option key={c.id} value={c.sessaoAbertaId ?? ""}>{c.nome}</option>
              ))}
            </select>
          ) : (
            <span className="pdv-chip-value" style={{ color: v("--text-muted") }}>{t("venda.noTill")}</span>
          )}
          {caixaAtual && <span className="pdv-chip-dot" title={t("caixa.session.open")} />}
        </div>
      </div>

      <form className="pdv-layout" onSubmit={(e) => e.preventDefault()}>
        <div className="pdv-catalog">
          {pickingId != null && produtoPicking ? (
            <div className="pdv-chassi-panel">
              <div className="pdv-chassi-head">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--gold") }}>{t("venda.pickChassis")}</p>
                  <p className="text-sm font-medium truncate mt-0.5" style={{ color: v("--text") }}>{produtoPicking.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: v("--text-muted") }}>
                    {tf(t, "venda.chassisInCart", { n: String(linhas.find((l) => l.idProduto === pickingId)?.unidades.length ?? 0) })}
                  </p>
                </div>
                <button type="button" className="btn-gold px-3 py-1.5 text-xs shrink-0" onClick={fecharPicker}>
                  {t("venda.chassisDone")}
                </button>
              </div>
              <div className="pdv-search-wrap">
                <input
                  ref={chassiRef}
                  className="field pdv-search font-mono"
                  value={buscaChassi}
                  placeholder={t("venda.chassisSearchPlaceholder")}
                  onChange={(e) => setBuscaChassi(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      tentarChassi();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      fecharPicker();
                    }
                  }}
                />
              </div>
              <div className="pdv-chassi-list">
                {carregandoChassi ? (
                  <p className="text-sm py-6 text-center" style={{ color: v("--text-muted") }}>{t("common.loading")}</p>
                ) : chassisFiltrados.length === 0 ? (
                  <p className="text-sm py-6 text-center" style={{ color: v("--text-muted") }}>{t("venda.noChassis")}</p>
                ) : (
                  chassisFiltrados.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="pdv-chassi-row"
                      onClick={() => adicionarUnidade(u)}
                    >
                      <span className="font-mono text-sm" style={{ color: v("--text") }}>{u.numero}</span>
                      <span className="text-[11px] font-mono" style={{ color: v("--text-muted") }}>{t("produto.chassiCodigo")} {u.id}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
          <div className="pdv-search-wrap">
            <input
              ref={produtoRef}
              className="field pdv-search font-mono"
              value={buscaProduto}
              placeholder={t("venda.productSearchPlaceholder")}
              onChange={(e) => setBuscaProduto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const q = buscaProduto.trim().toLowerCase();
                  const exato = produtos.find((p) => p.codigo.toLowerCase() === q);
                  if (exato) lancarProduto(exato.id);
                  else if (produtosVitrine.itens[0]) lancarProduto(produtosVitrine.itens[0].id);
                }
              }}
            />
          </div>

          <div className="pdv-filters">
            {(["todos", "bicicleta", "moto"] as const).map((f) => {
              const ativo = filtroTipo === f;
              const label = f === "todos" ? t("venda.filter.all") : t(`produto.tipo.${f}`);
              return (
                <button
                  key={f}
                  type="button"
                  className="pdv-filter"
                  style={{
                    background: ativo ? v("--text") : v("--card"),
                    color: ativo ? v("--bg") : v("--text-muted"),
                    border: ativo ? "1px solid transparent" : border1(),
                  }}
                  onClick={() => setFiltroTipo(f)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {produtosVitrine.itens.length < produtosVitrine.total && (
            <p className="text-xs" style={{ color: v("--text-muted") }}>
              {tf(t, "venda.vitrineMore", { n: String(produtosVitrine.itens.length), total: String(produtosVitrine.total) })}
            </p>
          )}
          <div className="pdv-cards">
            {produtosVitrine.itens.map((p) => {
              const semEstoque = p.quantidadeDisponivel != null && p.quantidadeDisponivel <= 0;
              const precoOp = converterMoeda(p.precoLista, p.moedaPreco, moedaOp, cotacao);
              return (
                <button
                  key={p.id}
                  type="button"
                  className="pdv-card"
                  disabled={semEstoque}
                  onClick={() => lancarProduto(p.id)}
                >
                  <div className="pdv-card-thumb" style={{ background: p.tipo === "moto" ? "var(--gold-bg)" : "var(--card2)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: v("--gold") }}>
                      {p.tipo === "moto"
                        ? <><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M8 17l3-8h5l3 8"/><path d="M6 11h4"/></>
                        : <><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M6.5 15l5-9 6 9"/><path d="M11.5 6v9"/></>}
                    </svg>
                  </div>
                  <p className="pdv-card-name">{p.nome}</p>
                  <p className="pdv-card-sku">{p.codigo}</p>
                  <div className="pdv-card-foot">
                    <span className="pdv-card-price">{formatMoeda(precoOp, moedaOp)}</span>
                    <span className="pdv-card-stock">{tf(t, "venda.units", { n: String(p.quantidadeDisponivel ?? 0) })}</span>
                  </div>
                  <EquivalentesMoeda valor={precoOp} de={moedaOp} cotacao={cotacao} />
                </button>
              );
            })}
          </div>
          {produtosVitrine.itens.length === 0 && (
            <p className="text-sm py-10 text-center" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</p>
          )}
            </>
          )}
        </div>

        <aside className="pdv-cart" style={{ background: v("--card"), border: border1() }}>
          <div className="pdv-cart-head">
            <div>
              <h2 className="pdv-cart-title">{passo === "pagamento" ? t("venda.pay") : t("venda.items")}</h2>
              <p className="text-xs mt-0.5" style={{ color: v("--text-muted") }}>{tf(t, "venda.itemsCount", { n: String(qtdItens) })}</p>
            </div>
            {passo === "pagamento" ? (
              <button type="button" className="text-xs cursor-pointer" style={{ color: v("--gold") }}
                onClick={() => setPasso("itens")}>
                {t("venda.backItems")}
              </button>
            ) : (
              <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }}
                onClick={limparCarrinho}>
                {t("venda.clear")}
              </button>
            )}
          </div>

          <div className="pdv-cart-body" ref={carrinhoRef}>
            {passo === "pagamento" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {finalizadores.map((f) => {
                    const ativo = pagamentos.some((p) => p.idFinalizador === f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className="pdv-pay px-3 py-2 text-sm rounded-md cursor-pointer"
                        style={{
                          background: ativo ? "var(--gold-bg)" : v("--card2"),
                          border: ativo ? `1px solid ${v("--gold-border")}` : border1(),
                          color: ativo ? v("--gold") : v("--text-sub"),
                        }}
                        onClick={() => escolherFinalizador(f.id)}
                      >
                        {f.nome}
                      </button>
                    );
                  })}
                </div>
                {pagamentos.map((p, idx) => {
                  const fin = finalizadores.find((f) => f.id === p.idFinalizador);
                  const pygLinha = paraPyg(parseGs(p.valor), p.moeda, cotacao);
                  return (
                    <div key={`${p.idFinalizador}-${p.moeda}-${idx}`} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs" style={{ color: v("--text-muted") }}>{t("venda.amount")} · {fin?.nome ?? ""}</p>
                        {pagamentos.length > 1 && (
                          <button type="button" className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                            onClick={() => setPagamentos((atual) => atual.filter((_, i) => i !== idx))}>
                            {t("common.delete")}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {MOEDAS.map((m) => {
                          const ativo = p.moeda === m;
                          const bloqueada = m !== "pyg" && !cotacao;
                          return (
                            <button
                              key={m}
                              type="button"
                              disabled={bloqueada}
                              className="pdv-pay px-2 py-1.5 text-xs rounded-md cursor-pointer"
                              style={{
                                background: ativo ? "var(--gold-bg)" : v("--card2"),
                                border: ativo ? `1px solid ${v("--gold-border")}` : border1(),
                                color: ativo ? v("--gold") : v("--text-sub"),
                                opacity: bloqueada ? 0.45 : 1,
                              }}
                              onClick={() => mudarMoeda(idx, m)}
                            >
                              {m === "pyg" ? t("venda.currency.pyg") : m === "brl" ? t("venda.currency.brl") : t("venda.currency.usd")}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        className="field font-mono"
                        inputMode="decimal"
                        value={p.valor}
                        onChange={(e) => setPagamentos((atual) =>
                          atual.map((x, i) => i === idx ? { ...x, valor: e.target.value } : x))}
                      />
                      {p.moeda !== "pyg" && pygLinha > 0 && (
                        <p className="text-xs font-mono" style={{ color: v("--text-muted") }}>
                          {tf(t, "venda.equivalent", { n: formatPyg(pygLinha) })}
                        </p>
                      )}
                    </div>
                  );
                })}
                <Field label={t("caixa.note")}>
                  <input className="field" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                </Field>
              </div>
            ) : linhas.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium" style={{ color: v("--text-sub") }}>{t("venda.emptyCart")}</p>
                <p className="text-xs mt-1" style={{ color: v("--text-muted") }}>{t("venda.emptyHint")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {linhas.map((l) => {
                  const p = produtos.find((x) => x.id === l.idProduto);
                  const unit = p ? paraPyg(p.precoLista, p.moedaPreco, cotacao) : 0;
                  const unitOp = converterMoeda(unit, "pyg", moedaOp, cotacao);
                  const linhaOp = converterMoeda(unit * l.quantidade, "pyg", moedaOp, cotacao);
                  return (
                    <div key={l.idProduto} className="pdv-cart-item">
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <p className="text-[13px] font-medium truncate" style={{ color: v("--text") }}>{p?.nome}</p>
                          <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: "var(--danger)" }}
                            title={t("common.delete")}
                            onClick={() => setLinhas((atual) => atual.filter((x) => x.idProduto !== l.idProduto))}>
                            ×
                          </button>
                        </div>
                        <p className="text-xs font-mono mt-0.5" style={{ color: v("--text-muted") }}>
                          {p?.codigo} · {formatMoeda(unitOp, moedaOp)}
                        </p>
                        {l.unidades.length > 0 && (
                          <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: v("--text-sub") }}
                            title={l.unidades.map((u) => u.numero).join("\n")}>
                            {l.unidades.length <= 2
                              ? l.unidades.map((u) => u.numero).join(" · ")
                              : `${l.unidades[0]?.numero} · ${l.unidades[1]?.numero} · ${tf(t, "venda.chassisMore", { n: String(l.unidades.length - 2) })}`}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button type="button" className="pdv-qty" onClick={() => alterarQtd(l.idProduto, -1)}>−</button>
                            <span className="font-mono text-sm w-7 text-center" style={{ color: v("--text") }}>{l.quantidade}</span>
                            <button type="button" className="pdv-qty" onClick={() => alterarQtd(l.idProduto, 1)}>+</button>
                          </div>
                          <span className="text-sm font-mono" style={{ color: v("--gold") }}>{formatMoeda(linhaOp, moedaOp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pdv-cart-checkout">
            <div className="space-y-1.5 text-sm">
              {passo === "pagamento" && (
                <>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: v("--text-muted") }}>{t("venda.paid")}</span>
                    <span className="font-mono" style={{ color: v("--text") }}>Gs. {formatPyg(pago)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: v("--text-muted") }}>{t("venda.remaining")}</span>
                    <span className="font-mono" style={{ color: falta === 0 ? "var(--success)" : v("--gold") }}>
                      Gs. {formatPyg(Math.max(0, falta))}
                    </span>
                  </div>
                </>
              )}
              <div className={passo === "pagamento" ? "pt-2" : ""} style={passo === "pagamento" ? { borderTop: border1() } : undefined}>
                <p className="text-[11px] font-medium tracking-widest uppercase mb-1" style={{ color: v("--text-muted") }}>{t("venda.total")}</p>
                <p className="pdv-total font-mono">{formatMoeda(converterMoeda(totalPyg, "pyg", moedaOp, cotacao), moedaOp)}</p>
                <EquivalentesMoeda valor={converterMoeda(totalPyg, "pyg", moedaOp, cotacao)} de={moedaOp} cotacao={cotacao} />
              </div>
            </div>
            {passo === "pagamento" ? (
              <button key="finish" type="button" disabled={salvando || !podeFinalizar} className="btn-gold px-5 py-3 text-sm w-full mt-3"
                onClick={() => void salvar()}>
                {salvando ? t("common.saving") : t("venda.finish")}
              </button>
            ) : (
              <button key="gopay" type="button" disabled={!podePagar} className="btn-gold px-5 py-3 text-sm w-full mt-3"
                onClick={irParaPagamento}>
                {t("venda.goPay")}
              </button>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
