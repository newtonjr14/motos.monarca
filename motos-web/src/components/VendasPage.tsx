import {
  buscarCotacaoHoje,
  criarVenda,
  listarCaixas,
  listarFinalizadores,
  listarPapeis,
  listarProdutos,
  listarUnidades,
  listarVendedoresVenda,
  Permissao,
  type Caixa,
  type Cotacao,
  type Finalizador,
  type Moeda,
  type Papel,
  type Produto,
  type ProdutoUnidade,
  type TipoProduto,
  type Venda,
  type VendedorOpcao,
} from "@/api";
import ClienteRapidoModal from "@/components/ClienteRapidoModal";
import EquivalentesMoeda from "@/components/EquivalentesMoeda";
import F2InsideHint from "@/components/F2InsideHint";
import ProdutoMiniatura from "@/components/ProdutoMiniatura";
import ReciboVenda from "@/components/ReciboVenda";
import SearchPickerModal, { type SearchPickerItem } from "@/components/SearchPickerModal";
import { Field } from "@/components/crud/Field";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useAuth } from "@/auth/AuthContext";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type ItemDraft = { linhaId: string; idProduto: number; quantidade: number; unidades: UnidadeDraft[]; descontoPct: number };
type PagDraft = { idFinalizador: number; moeda: Moeda; valor: string };
type FiltroTipo = "todos" | TipoProduto;
/** Vendas em espera só na memória da aba — some ao fechar o navegador. */
type VendaEmEspera = {
  id: number;
  rotulo: string;
  idCliente: number | "";
  idVendedor: number | "";
  linhas: ItemDraft[];
  observacao: string;
  descontoVenda: number;
};
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

function somarMeses(data: Date, meses: number, dia: number): Date {
  const base = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(dia, ultimo));
  return base;
}

function preverParcelas(
  total: number,
  qtd: number,
  modo: "intervalo_30" | "dia_fixo",
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

function novaLinhaId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
  const { t, locale } = useI18n();
  const { user, hasPermission } = useAuth();
  const { filial } = useFilial();
  const moedaOp = moedaOperacaoDe(filial?.moedaOperacao);
  const podeDesconto = hasPermission(Permissao.VENDA_DESCONTO);
  const caixaPadrao = caixas.find((c) => c.padrao) ?? (caixas.length === 1 ? caixas[0] : undefined);
  const sessaoPadrao = caixaPadrao?.sessaoAbertaId ?? null;
  const [idCliente, setIdCliente] = useState<number | "">("");
  const [idVendedor, setIdVendedor] = useState<number | "">(user?.id ?? "");
  const [vendedores, setVendedores] = useState<VendedorOpcao[]>([]);
  const [idSessao, setIdSessao] = useState<number | "">("");
  const [linhas, setLinhas] = useState<ItemDraft[]>([]);
  type ModoVencimento = "intervalo_30" | "dia_fixo";
  const [pagamentos, setPagamentos] = useState<PagDraft[]>([]);
  const [qtdParcelas, setQtdParcelas] = useState("3");
  const [modoVencimento, setModoVencimento] = useState<ModoVencimento>("intervalo_30");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [recibo, setRecibo] = useState<Venda | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [passo, setPasso] = useState<"itens" | "pagamento">("itens");

  const [buscaCliente, setBuscaCliente] = useState("");
  const [listaCliente, setListaCliente] = useState(false);
  const [buscaVendedor, setBuscaVendedor] = useState("");
  const [listaVendedor, setListaVendedor] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const produtoRef = useRef<HTMLInputElement>(null);
  const clienteRef = useRef<HTMLButtonElement>(null);
  const carrinhoRef = useRef<HTMLDivElement>(null);
  const chassiRef = useRef<HTMLInputElement>(null);
  const [pickingId, setPickingId] = useState<number | null>(null);
  const [unidadesDisp, setUnidadesDisp] = useState<ProdutoUnidade[]>([]);
  const [buscaChassi, setBuscaChassi] = useState("");
  const [carregandoChassi, setCarregandoChassi] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [esperas, setEsperas] = useState<VendaEmEspera[]>([]);
  const [listaCaixa, setListaCaixa] = useState(false);
  const [definindo, setDefinindo] = useState(false);
  const [descontoVenda, setDescontoVenda] = useState(0);
  const [descontoValorTxt, setDescontoValorTxt] = useState("");
  const descontoValorFoco = useRef(false);
  const [listaFinalizador, setListaFinalizador] = useState(false);
  const [buscaFinalizador, setBuscaFinalizador] = useState("");
  const [defId, setDefId] = useState<number | "">("");
  const [defMoeda, setDefMoeda] = useState<Moeda>("pyg");
  const [defValor, setDefValor] = useState("");

  const cliente = idCliente === "" ? undefined : clientes.find((c) => c.id === idCliente);
  const vendedor = idVendedor === ""
    ? undefined
    : vendedores.find((vdd) => vdd.id === idVendedor)
      ?? (user && user.id === idVendedor ? { id: user.id, nome: user.nome } : undefined);
  const caixaEmUso = caixas.find((c) => c.sessaoAbertaId != null && c.sessaoAbertaId === idSessao) ?? caixaPadrao;
  const outrosAbertos = sessaoPadrao
    ? caixas.filter((c) => c.sessaoAbertaId && c.id !== caixaEmUso?.id)
    : [];

  const limparCarrinho = useCallback(() => {
    setLinhas([]);
    setPagamentos([]);
    setDefinindo(false);
    setDescontoVenda(0);
    setDescontoValorTxt("");
    setDefId("");
    setDefValor("");
    setQtdParcelas("3");
    setModoVencimento("intervalo_30");
    setDiaVencimento("10");
    setObservacao("");
    setErro(null);
    setBuscaProduto("");
    setPasso("itens");
    setPickingId(null);
    setUnidadesDisp([]);
    setBuscaChassi("");
    produtoRef.current?.focus();
  }, []);

  const pedirDescartar = useCallback(() => {
    if (linhas.length > 0 && !window.confirm(t("venda.discardConfirm"))) return;
    limparCarrinho();
  }, [linhas.length, limparCarrinho, t]);

  useCrudReset(navReset, pedirDescartar);

  useEffect(() => {
    if (linhas.length === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [linhas.length]);

  useEffect(() => {
    void listarVendedoresVenda(idFilial)
      .then(setVendedores)
      .catch(() => setVendedores([]));
  }, [idFilial]);

  useEffect(() => {
    const padrao = caixas.find((c) => c.padrao) ?? (caixas.length === 1 ? caixas[0] : undefined);
    const sessao = padrao?.sessaoAbertaId ?? null;
    setIdSessao((atual) => {
      if (!sessao) return "";
      if (atual !== "" && caixas.some((c) => c.sessaoAbertaId === atual)) return atual;
      return sessao;
    });
    if (!sessao) setListaCaixa(false);
  }, [caixas]);

  const pygDasLinhas = useCallback((itens: ItemDraft[]) => itens.reduce((acc, linha) => {
    const p = produtos.find((x) => x.id === linha.idProduto);
    if (!p) return acc;
    const bruto = paraPyg(p.precoLista, p.moedaPreco, cotacao) * linha.quantidade;
    const desc = bruto * ((linha.descontoPct || 0) / 100);
    return acc + Math.max(0, Math.round(bruto - desc));
  }, 0), [produtos, cotacao]);

  const totalPyg = useMemo(() => pygDasLinhas(linhas), [linhas, pygDasLinhas]);
  const descontoVendaPyg = Math.round(totalPyg * (descontoVenda || 0) / 100);
  const totalLiquido = Math.max(0, totalPyg - descontoVendaPyg);

  function textoValorDesconto(pyg: number) {
    const n = converterMoeda(pyg, "pyg", moedaOp, cotacao);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (moedaOp === "pyg") return String(Math.round(n));
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  useEffect(() => {
    if (descontoValorFoco.current) return;
    setDescontoValorTxt(descontoVenda <= 0 ? "" : textoValorDesconto(descontoVendaPyg));
  }, [descontoVenda, descontoVendaPyg, moedaOp, cotacao]);

  const resumoPag = useMemo(() => {
    let aplicado = 0;
    let trocoPyg = 0;
    const enviaveis: { idFinalizador: number; moeda: Moeda; valor: number }[] = [];
    for (const p of pagamentos) {
      const pyg = Math.round(paraPyg(parseGs(p.valor), p.moeda, cotacao));
      if (pyg <= 0) continue;
      const fin = finalizadores.find((f) => f.id === p.idFinalizador);
      const faltaAgora = Math.max(0, Math.round(totalLiquido - aplicado));
      if (fin?.tipo === "dinheiro" && pyg > faltaAgora) {
        trocoPyg += pyg - faltaAgora;
        if (faltaAgora > 0) {
          const valor = p.moeda === "pyg" ? faltaAgora : Math.round(dePyg(faltaAgora, p.moeda, cotacao) * 100) / 100;
          enviaveis.push({ idFinalizador: p.idFinalizador, moeda: p.moeda, valor });
          aplicado += faltaAgora;
        }
      } else {
        aplicado += pyg;
        enviaveis.push({ idFinalizador: p.idFinalizador, moeda: p.moeda, valor: parseGs(p.valor) });
      }
    }
    return { aplicado, trocoPyg, falta: Math.round(totalLiquido - aplicado), enviaveis };
  }, [pagamentos, totalLiquido, finalizadores, cotacao]);
  const pago = resumoPag.aplicado;
  const falta = resumoPag.falta;
  const troco = resumoPag.trocoPyg;

  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.trim().toLowerCase();
    const base = q ? clientes.filter((c) => textoCliente(c).toLowerCase().includes(q)) : clientes;
    return base.slice(0, 80);
  }, [clientes, buscaCliente]);

  const vendedoresFiltrados = useMemo(() => {
    const q = buscaVendedor.trim().toLowerCase();
    const base = q ? vendedores.filter((vdd) => vdd.nome.toLowerCase().includes(q)) : vendedores;
    return base.slice(0, 80);
  }, [vendedores, buscaVendedor]);

  const itensCliente: SearchPickerItem[] = useMemo(() => clientesFiltrados.map((c) => ({
    id: String(c.id),
    label: (
      <span>
        <span className="block">{c.pessoa.nomeRazaoSocial}</span>
        {docCliente(c) && <span className="block text-xs font-mono" style={{ color: v("--text-muted") }}>{docCliente(c)}</span>}
      </span>
    ),
    selected: idCliente === c.id,
  })), [clientesFiltrados, idCliente]);

  const itensVendedor: SearchPickerItem[] = useMemo(() => vendedoresFiltrados.map((vdd) => ({
    id: String(vdd.id),
    label: vdd.nome,
    selected: idVendedor === vdd.id,
  })), [vendedoresFiltrados, idVendedor]);

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
    setLinhas((lista) => [
      {
        linhaId: novaLinhaId(),
        idProduto: u.idProduto,
        quantidade: 1,
        unidades: [{ id: u.id, numero: u.numero }],
        descontoPct: 0,
      },
      ...lista,
    ]);
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
      const i = lista.findIndex((l) => l.idProduto === id && l.unidades.length === 0);
      if (i >= 0) {
        const linha = { ...lista[i]!, quantidade: next };
        return [linha, ...lista.filter((_, idx) => idx !== i)];
      }
      return [{ linhaId: novaLinhaId(), idProduto: id, quantidade: 1, unidades: [], descontoPct: 0 }, ...lista];
    });
    setBuscaProduto("");
    setErro(null);
    produtoRef.current?.focus();
    requestAnimationFrame(() => { carrinhoRef.current && (carrinhoRef.current.scrollTop = 0); });
  }

  function alterarQtd(linhaId: string, delta: number) {
    const atual = linhas.find((l) => l.linhaId === linhaId);
    if (!atual || atual.unidades.length > 0) return;
    const p = produtos.find((x) => x.id === atual.idProduto);
    const next = atual.quantidade + delta;
    if (next <= 0) {
      setLinhas((lista) => lista.filter((l) => l.linhaId !== linhaId));
      setErro(null);
      return;
    }
    if (p?.quantidadeDisponivel != null && next > p.quantidadeDisponivel) {
      setErro(t("venda.error.qty"));
      return;
    }
    setLinhas((lista) => lista.map((l) => l.linhaId === linhaId ? { ...l, quantidade: next } : l));
    setErro(null);
  }

  function abrirDefinir() {
    const rest = Math.max(0, falta);
    const moeda: Moeda = moedaOp !== "pyg" && cotacao ? moedaOp : "pyg";
    setDefMoeda(moeda);
    setDefValor(formatarValorMoeda(rest, moeda, cotacao));
    setDefId("");
    setBuscaFinalizador("");
    setDefinindo(true);
    setErro(null);
  }

  function mudarDefMoeda(moeda: Moeda) {
    if (moeda !== "pyg" && !cotacao) return;
    const pyg = paraPyg(parseGs(defValor), defMoeda, cotacao);
    setDefMoeda(moeda);
    setDefValor(formatarValorMoeda(pyg || Math.max(0, falta), moeda, cotacao));
  }

  function mudarDescontoVenda(pct: number) {
    setDescontoVenda(pct);
    if (!definindo) return;
    const liquido = Math.max(0, totalPyg - Math.round(totalPyg * pct / 100));
    const rest = Math.max(0, liquido - pago);
    setDefValor(formatarValorMoeda(rest, defMoeda, cotacao));
  }

  function mudarDescontoPct(pct: number) {
    mudarDescontoVenda(pct);
    setDescontoValorTxt(pct <= 0 ? "" : textoValorDesconto(Math.round(totalPyg * pct / 100)));
  }

  function mudarDescontoValor(raw: string) {
    const limpo = raw.replace(",", ".").replace(/[^\d.]/g, "");
    setDescontoValorTxt(limpo);
    const n = Number.parseFloat(limpo);
    if (!limpo || !Number.isFinite(n) || n <= 0) {
      mudarDescontoVenda(0);
      return;
    }
    const pyg = Math.min(totalPyg, Math.max(0, Math.round(paraPyg(n, moedaOp, cotacao))));
    const pct = totalPyg > 0 ? Math.min(100, Math.round((pyg / totalPyg) * 10000) / 100) : 0;
    mudarDescontoVenda(pct);
  }

  function confirmarDefinir() {
    if (defId === "") {
      setErro(t("venda.error.pay"));
      return;
    }
    const fin = finalizadores.find((f) => f.id === defId);
    const pyg = Math.round(paraPyg(parseGs(defValor), defMoeda, cotacao));
    if (pyg <= 0) {
      setErro(t("venda.error.pay"));
      return;
    }
    const jaCredito = pagamentos.some((p) => finalizadores.find((f) => f.id === p.idFinalizador)?.geraContasReceber);
    if (fin?.geraContasReceber && jaCredito) {
      setErro(t("api.VENDA_CREDITO_UNICO"));
      return;
    }
    if (fin?.tipo !== "dinheiro" && pyg > Math.max(0, falta) + 1) {
      setErro(t("venda.payOver"));
      return;
    }
    if (fin?.geraContasReceber) {
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
    setPagamentos((atual) => [...atual, { idFinalizador: defId, moeda: defMoeda, valor: defValor }]);
    setDefinindo(false);
    setErro(null);
  }

  function escolherCliente(id: number) {
    setIdCliente(id);
    setListaCliente(false);
    setBuscaCliente("");
    setModalCliente(false);
    produtoRef.current?.focus();
  }

  async function clienteRapidoCriado(id: number) {
    setModalCliente(false);
    await onSaved();
    escolherCliente(id);
  }

  function segurarVenda() {
    if (linhas.length === 0) return;
    const rotulo = cliente?.pessoa.nomeRazaoSocial
      ?? (buscaCliente.trim() || t("venda.heldNoClient"));
    setEsperas((atual) => [
      ...atual,
      {
        id: Date.now(),
        rotulo,
        idCliente,
        idVendedor,
        linhas: linhas.map((l) => ({ ...l, unidades: [...l.unidades] })),
        observacao,
        descontoVenda,
      },
    ]);
    limparCarrinho();
  }

  function retomarEspera(id: number) {
    const item = esperas.find((e) => e.id === id);
    if (!item) return;
    if (linhas.length > 0 && !window.confirm(t("venda.discardConfirm"))) return;
    setIdCliente(item.idCliente);
    setIdVendedor(item.idVendedor);
    setLinhas(item.linhas.map((l) => ({ ...l, linhaId: l.linhaId || novaLinhaId(), unidades: [...l.unidades] })));
    setObservacao(item.observacao);
    setDescontoVenda(item.descontoVenda || 0);
    setDescontoValorTxt("");
    setPagamentos([]);
    setDefinindo(false);
    setPasso("itens");
    setEsperas((atual) => atual.filter((e) => e.id !== id));
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
    if (idSessao === "") {
      setErro(t("venda.tillClosed"));
      return;
    }
    const negociacao = resumoPag.enviaveis.filter((p) => p.valor > 0);
    if (!negociacao.length) {
      setErro(t("venda.error.pay"));
      return;
    }
    const credito = negociacao.filter((p) => finalizadores.find((f) => f.id === p.idFinalizador)?.geraContasReceber);
    if (credito.length > 1) {
      setErro(t("api.VENDA_CREDITO_UNICO"));
      return;
    }
    const pagoPyg = negociacao.reduce((a, p) => a + paraPyg(p.valor, p.moeda, cotacao), 0);
    if (Math.abs(pagoPyg - totalPyg) > 1) {
      setErro(t("api.VENDA_NEGOCIACAO_DIVERGENTE"));
      return;
    }
    const qtd = Number.parseInt(qtdParcelas, 10) || 0;
    if (credito.length > 0 && (qtd < 1 || qtd > 120)) {
      setErro(t("api.PARCELAS_QTD"));
      return;
    }
    setSalvando(true);
    try {
      const venda = await criarVenda({
        idFilial,
        idCliente,
        idVendedor,
        idCaixaSessao: idSessao === "" ? null : idSessao,
        itens: linhas.map((l) => ({
          idProduto: l.idProduto,
          quantidade: l.quantidade,
          idsUnidades: l.unidades.map((u) => u.id),
          descontoPct: l.descontoPct || 0,
        })),
        negociacao,
        parcelas: credito.length > 0
          ? {
              quantidade: qtd,
              modoVencimento,
              diaVencimento: modoVencimento === "dia_fixo" ? (Number.parseInt(diaVencimento, 10) || 10) : null,
            }
          : null,
        descontoPct: podeDesconto ? descontoVenda : 0,
        observacao: observacao.trim() || null,
      });
      limparCarrinho();
      setRecibo(venda);
      await onSaved();
      produtoRef.current?.focus();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  const qtdItens = linhas.reduce((acc, l) => acc + l.quantidade, 0);
  const podePagar = idCliente !== "" && idVendedor !== "" && linhas.length > 0 && idSessao !== "";
  const podeFinalizar = podePagar && Math.abs(falta) <= 1 && resumoPag.enviaveis.length > 0;

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
    if (idSessao === "") {
      setErro(caixaPadrao ? t("venda.tillClosed") : t("venda.noTill"));
      return;
    }
    setDefinindo(false);
    setPasso("pagamento");
  }

  return (
    <div className="pdv-page">
      {erro && <p className="text-sm mb-2 shrink-0" style={{ color: "#ef4444" }}>{erro}</p>}

      <div className="pdv-top">
        <div className="pdv-chip">
          <span className="pdv-chip-label">{t("venda.client")}</span>
          {cliente ? (
            <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
              <span className="pdv-chip-value truncate">{cliente.pessoa.nomeRazaoSocial}</span>
              <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: v("--gold") }}
                onClick={() => { setBuscaCliente(""); setListaCliente(true); }}>
                {t("venda.changeClient")}
              </button>
            </div>
          ) : (
            <button
              ref={clienteRef}
              type="button"
              className="pdv-chip-input flex items-center justify-between gap-2 text-left cursor-pointer"
              onClick={() => { setBuscaCliente(""); setListaCliente(true); }}
              onKeyDown={(e) => {
                if (e.key === "F2") {
                  e.preventDefault();
                  setBuscaCliente("");
                  setListaCliente(true);
                }
              }}
            >
              <span className="truncate" style={{ color: v("--text-muted") }}>{t("venda.clientSearchPlaceholder")}</span>
              <F2InsideHint />
            </button>
          )}
        </div>

        <div className="pdv-chip">
          <span className="pdv-chip-label">{t("venda.seller")}</span>
          {vendedor ? (
            <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
              <span className="pdv-chip-value truncate">{vendedor.nome}</span>
              <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: v("--gold") }}
                onClick={() => { setBuscaVendedor(""); setListaVendedor(true); }}>
                {t("venda.changeSeller")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pdv-chip-input flex items-center justify-between gap-2 text-left cursor-pointer"
              onClick={() => { setBuscaVendedor(""); setListaVendedor(true); }}
              onKeyDown={(e) => {
                if (e.key === "F2") {
                  e.preventDefault();
                  setBuscaVendedor("");
                  setListaVendedor(true);
                }
              }}
            >
              <span className="truncate" style={{ color: v("--text-muted") }}>{t("venda.sellerSearchPlaceholder")}</span>
              <F2InsideHint />
            </button>
          )}
        </div>

        <div className="pdv-chip relative">
          <span className="pdv-chip-label">{t("venda.till")}</span>
          {caixaPadrao ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="pdv-chip-value truncate">{caixaEmUso?.nome ?? caixaPadrao.nome}</span>
              {sessaoPadrao ? (
                <span className="pdv-chip-dot" title={t("caixa.session.open")} />
              ) : (
                <span className="text-xs shrink-0" style={{ color: "var(--danger)" }}>{t("venda.tillClosed")}</span>
              )}
              {sessaoPadrao && outrosAbertos.length > 0 && (
                <button type="button" className="text-xs cursor-pointer shrink-0 ml-auto" style={{ color: v("--gold") }}
                  onClick={() => setListaCaixa((x) => !x)}>
                  {t("venda.changeTill")}
                </button>
              )}
            </div>
          ) : (
            <span className="pdv-chip-value" style={{ color: v("--text-muted") }}>{t("venda.noTill")}</span>
          )}
          {listaCaixa && sessaoPadrao && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setListaCaixa(false)} />
              <ul className="absolute right-2 top-full mt-1 z-30 rounded-md shadow-lg overflow-hidden min-w-[10rem]"
                style={{ background: v("--card"), border: border1() }}>
                {caixas.filter((c) => c.sessaoAbertaId).map((c) => (
                  <li key={c.id}>
                    <button type="button" className="w-full text-left px-3 py-2 text-sm cursor-pointer"
                      style={{ color: c.sessaoAbertaId === idSessao ? v("--gold") : v("--text") }}
                      onClick={() => { setIdSessao(c.sessaoAbertaId ?? ""); setListaCaixa(false); }}>
                      {c.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="pdv-open">
        <span className="pdv-open-label">{t("venda.open")}</span>
        {esperas.length === 0 ? (
          <span className="pdv-open-empty">{t("venda.openEmpty")}</span>
        ) : (
          esperas.map((e) => {
            const qtd = e.linhas.reduce((a, l) => a + l.quantidade, 0);
            const total = pygDasLinhas(e.linhas);
            return (
              <button key={e.id} type="button" className="pdv-open-chip" onClick={() => retomarEspera(e.id)}>
                <span className="truncate font-medium">{e.rotulo}</span>
                <span className="font-mono shrink-0" style={{ color: v("--text-muted") }}>
                  {tf(t, "venda.itemsCount", { n: String(qtd) })} · {formatMoeda(converterMoeda(total, "pyg", moedaOp, cotacao), moedaOp)}
                </span>
              </button>
            );
          })
        )}
        {linhas.length > 0 && (
          <button type="button" className="pdv-open-hold" onClick={segurarVenda}>
            {t("venda.hold")}
          </button>
        )}
      </div>

      <form className={passo === "pagamento" ? "pdv-layout is-pay" : "pdv-layout"} onSubmit={(e) => e.preventDefault()}>
        <div className="pdv-catalog">
          {passo === "pagamento" ? (
            <div className="pdv-pay-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="pdv-cart-title">{t("venda.pay")}</h2>
                  <p className="text-xs mt-0.5" style={{ color: v("--text-muted") }}>
                    {cliente?.pessoa.nomeRazaoSocial ?? ""} · {tf(t, "venda.itemsCount", { n: String(qtdItens) })}
                  </p>
                </div>
                <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: v("--gold") }}
                  onClick={() => setPasso("itens")}>
                  {t("venda.backItems")}
                </button>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                {podeDesconto && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("venda.saleDiscount")}</p>
                    <label className="pdv-discount" style={{ marginLeft: 0 }}>
                      <input
                        inputMode="decimal"
                        aria-label={t("venda.saleDiscount")}
                        value={descontoVenda === 0 ? "" : String(descontoVenda)}
                        placeholder="0"
                        onChange={(e) => {
                          const raw = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
                          const n = Number.parseFloat(raw);
                          const pct = !Number.isFinite(n) || raw === "" ? 0 : Math.min(100, Math.max(0, Math.round(n * 100) / 100));
                          mudarDescontoPct(pct);
                        }}
                      />
                      <span>%</span>
                      <input
                        className="pdv-discount-value"
                        inputMode="decimal"
                        aria-label={t("venda.amount")}
                        value={descontoValorTxt}
                        placeholder={moedaOp === "pyg" ? "0" : "0.00"}
                        onFocus={() => { descontoValorFoco.current = true; }}
                        onBlur={() => {
                          descontoValorFoco.current = false;
                          setDescontoValorTxt(descontoVenda <= 0 ? "" : textoValorDesconto(descontoVendaPyg));
                        }}
                        onChange={(e) => mudarDescontoValor(e.target.value)}
                      />
                      <span>{moedaOp === "pyg" ? t("venda.currency.pyg") : moedaOp === "brl" ? t("venda.currency.brl") : t("venda.currency.usd")}</span>
                    </label>
                  </div>
                )}
                <div className="space-y-1 text-sm min-w-[13rem] ml-auto">
                  <div className="flex justify-between gap-4">
                    <span style={{ color: v("--text-muted") }}>{t("venda.paid")}</span>
                    <span className="font-mono" style={{ color: v("--text") }}>{formatMoeda(converterMoeda(pago, "pyg", moedaOp, cotacao), moedaOp)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: v("--text-muted") }}>{t("venda.remainingValue")}</span>
                    <span className="font-mono" style={{ color: Math.abs(falta) <= 1 ? "var(--success)" : v("--gold") }}>
                      {formatMoeda(converterMoeda(Math.max(0, falta), "pyg", moedaOp, cotacao), moedaOp)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: v("--text-muted") }}>{t("venda.change")}</span>
                    <span className="font-mono" style={{ color: v("--text") }}>{formatMoeda(converterMoeda(troco, "pyg", moedaOp, cotacao), moedaOp)}</span>
                  </div>
                </div>
              </div>
              {definindo ? (
                <div className="space-y-3 rounded-md p-3" style={{ background: v("--card2"), border: border1() }}>
                  <div>
                    <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("venda.pay")}</p>
                    <button
                      type="button"
                      className="field max-w-sm flex items-center justify-between gap-2 text-left cursor-pointer"
                      onClick={() => { setBuscaFinalizador(""); setListaFinalizador(true); }}
                      onKeyDown={(e) => {
                        if (e.key === "F2") {
                          e.preventDefault();
                          setBuscaFinalizador("");
                          setListaFinalizador(true);
                        }
                      }}
                    >
                      <span className="truncate" style={{ color: defId === "" ? v("--text-muted") : v("--text") }}>
                        {defId === ""
                          ? t("venda.finalizerSearch")
                          : (finalizadores.find((f) => f.id === defId)?.nome ?? "")}
                      </span>
                      <F2InsideHint />
                    </button>
                  </div>
                  <div className="max-w-sm">
                    <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("venda.remainingValue")}</p>
                    <p className="field font-mono" style={{ color: v("--text") }}>
                      {formatMoeda(converterMoeda(Math.max(0, falta), "pyg", defMoeda, cotacao), defMoeda)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 max-w-sm">
                    {MOEDAS.map((m) => {
                      const ativo = defMoeda === m;
                      const bloqueada = m !== "pyg" && !cotacao;
                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={bloqueada}
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
                  <div className="max-w-sm">
                    <p className="text-xs mb-1" style={{ color: v("--text-muted") }}>{t("venda.payAmount")}</p>
                    <input
                      className="field font-mono"
                      inputMode="decimal"
                      value={defValor}
                      onChange={(e) => setDefValor(e.target.value)}
                    />
                  </div>
                  {defMoeda !== "pyg" && paraPyg(parseGs(defValor), defMoeda, cotacao) > 0 && (
                    <p className="text-xs font-mono" style={{ color: v("--text-muted") }}>
                      {tf(t, "venda.equivalent", { n: formatPyg(paraPyg(parseGs(defValor), defMoeda, cotacao)) })}
                    </p>
                  )}
                  {finalizadores.find((f) => f.id === defId)?.geraContasReceber && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium" style={{ color: v("--text") }}>{t("venda.parcelas")}</p>
                      <Field label={t("venda.qtdParcelas")}>
                        <input className="field" inputMode="numeric" value={qtdParcelas}
                          onChange={(e) => setQtdParcelas(e.target.value.replace(/\D/g, ""))} />
                      </Field>
                      <Field label={t("venda.modoVencimento")}>
                        <select className="field" value={modoVencimento}
                          onChange={(e) => setModoVencimento(e.target.value as "intervalo_30" | "dia_fixo")}>
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
                      {parseGs(defValor) > 0 && (Number.parseInt(qtdParcelas, 10) || 0) >= 1 && (
                        <table className="pdv-pay-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>{t("venda.due")}</th>
                              <th>{t("venda.amount")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preverParcelas(
                              parseGs(defValor),
                              Number.parseInt(qtdParcelas, 10) || 0,
                              modoVencimento,
                              Number.parseInt(diaVencimento, 10) || 10,
                              defMoeda,
                            ).map((p) => (
                              <tr key={p.numero}>
                                <td>{p.numero}</td>
                                <td>{p.vencimento.toLocaleDateString(locale === "pt" ? "pt-BR" : "es-PY")}</td>
                                <td className="font-mono">{formatMoeda(p.valor, defMoeda)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" className="text-xs cursor-pointer px-3 py-2" style={{ color: v("--text-muted") }}
                      onClick={() => { setDefinindo(false); setErro(null); }}>
                      {t("common.cancel")}
                    </button>
                    <button type="button" className="btn-gold px-4 py-2 text-sm" onClick={confirmarDefinir}>
                      {t("venda.confirmPay")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {pagamentos.length === 0 ? (
                    <p className="text-sm py-6 text-center" style={{ color: v("--text-muted") }}>{t("venda.payEmpty")}</p>
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
                          const qtd = fin?.geraContasReceber ? Number.parseInt(qtdParcelas, 10) || 0 : 0;
                          return (
                            <tr key={`${p.idFinalizador}-${idx}`}>
                              <td>{fin?.nome ?? ""}{qtd > 1 ? ` ${qtd}x` : ""}</td>
                              <td className="font-mono">
                                {formatMoeda(parseGs(p.valor), p.moeda)}
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
                  {falta > 1 && (
                    <button type="button" className="btn-gold px-4 py-2 text-sm self-start" onClick={abrirDefinir}>
                      {t("venda.definePay")}
                    </button>
                  )}
                </>
              )}
              <Field label={t("caixa.note")}>
                <input className="field max-w-sm" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </Field>
            </div>
          ) : pickingId != null && produtoPicking ? (
            <div className="pdv-chassi-panel">
              <div className="pdv-chassi-head">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--gold") }}>{t("venda.pickChassis")}</p>
                  <p className="text-sm font-medium truncate mt-0.5" style={{ color: v("--text") }}>{produtoPicking.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: v("--text-muted") }}>
                    {tf(t, "venda.chassisInCart", { n: String(linhas.filter((l) => l.idProduto === pickingId).length) })}
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
                    <ProdutoMiniatura produto={p} />
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
              <h2 className="pdv-cart-title">{passo === "pagamento" ? t("venda.summary") : t("venda.items")}</h2>
              <p className="text-xs mt-0.5" style={{ color: v("--text-muted") }}>
                {passo === "pagamento" && cliente ? `${cliente.pessoa.nomeRazaoSocial} · ` : ""}
                {tf(t, "venda.itemsCount", { n: String(qtdItens) })}
              </p>
            </div>
            {passo !== "pagamento" && (
              <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }}
                onClick={pedirDescartar}>
                {t("venda.clear")}
              </button>
            )}
          </div>

          <div className="pdv-cart-body" ref={carrinhoRef}>
            {passo === "pagamento" ? (
              <div className="space-y-3">
                {linhas.map((l) => {
                  const p = produtos.find((x) => x.id === l.idProduto);
                  const unit = p ? paraPyg(p.precoLista, p.moedaPreco, cotacao) : 0;
                  const bruto = unit * l.quantidade;
                  const descPct = l.descontoPct || 0;
                  const liquido = Math.max(0, Math.round(bruto - bruto * descPct / 100));
                  const linhaOp = converterMoeda(liquido, "pyg", moedaOp, cotacao);
                  return (
                    <div key={l.linhaId} className="pdv-cart-item">
                      <div className="flex justify-between gap-2">
                        <p className="text-[13px] font-medium truncate" style={{ color: v("--text") }}>{p?.nome}</p>
                        <span className="text-sm font-mono shrink-0" style={{ color: v("--gold") }}>{formatMoeda(linhaOp, moedaOp)}</span>
                      </div>
                      <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: v("--text-muted") }}>
                        {l.quantidade} · {l.unidades[0]?.numero ?? p?.codigo}
                        {descPct > 0 ? ` · ${descPct}%` : ""}
                      </p>
                    </div>
                  );
                })}
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
                  const bruto = unit * l.quantidade;
                  const descPct = l.descontoPct || 0;
                  const liquido = Math.max(0, Math.round(bruto - bruto * descPct / 100));
                  const linhaOp = converterMoeda(liquido, "pyg", moedaOp, cotacao);
                  const brutoOp = converterMoeda(bruto, "pyg", moedaOp, cotacao);
                  return (
                    <div key={l.linhaId} className="pdv-cart-item">
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <p className="text-[13px] font-medium truncate" style={{ color: v("--text") }}>{p?.nome}</p>
                          <button type="button" className="text-xs cursor-pointer shrink-0" style={{ color: "var(--danger)" }}
                            title={t("common.delete")}
                            onClick={() => setLinhas((atual) => atual.filter((x) => x.linhaId !== l.linhaId))}>
                            ×
                          </button>
                        </div>
                        <p className="text-xs font-mono mt-0.5" style={{ color: v("--text-muted") }}>
                          {p?.codigo} · {formatMoeda(unitOp, moedaOp)}
                        </p>
                        {l.unidades.length > 0 && (
                          <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: v("--text-sub") }}>
                            {l.unidades[0]?.numero}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          {l.unidades.length === 0 && (
                          <div className="flex items-center gap-1">
                            <button type="button" className="pdv-qty" onClick={() => alterarQtd(l.linhaId, -1)}>−</button>
                            <span className="font-mono text-sm w-7 text-center" style={{ color: v("--text") }}>{l.quantidade}</span>
                            <button type="button" className="pdv-qty" onClick={() => alterarQtd(l.linhaId, 1)}>+</button>
                          </div>
                          )}
                          {podeDesconto && (
                            <label className="pdv-discount">
                              <span>{t("venda.discount")}</span>
                              <input
                                inputMode="decimal"
                                aria-label={t("venda.discount")}
                                value={descPct === 0 ? "" : String(descPct)}
                                placeholder="0"
                                onChange={(e) => {
                                  const raw = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
                                  const n = Number.parseFloat(raw);
                                  const pct = !Number.isFinite(n) || raw === "" ? 0 : Math.min(100, Math.max(0, Math.round(n * 100) / 100));
                                  setLinhas((atual) => atual.map((x) => x.linhaId === l.linhaId ? { ...x, descontoPct: pct } : x));
                                }}
                              />
                              <span>%</span>
                            </label>
                          )}
                          <span className="text-sm font-mono text-right" style={{ color: v("--gold") }}>
                            {descPct > 0 && (
                              <span className="block text-[11px] line-through" style={{ color: v("--text-muted") }}>
                                {formatMoeda(brutoOp, moedaOp)}
                              </span>
                            )}
                            {formatMoeda(linhaOp, moedaOp)}
                          </span>
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
                    <span className="font-mono" style={{ color: v("--text") }}>{formatMoeda(converterMoeda(pago, "pyg", moedaOp, cotacao), moedaOp)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: v("--text-muted") }}>{t("venda.remaining")}</span>
                    <span className="font-mono" style={{ color: Math.abs(falta) <= 1 ? "var(--success)" : v("--gold") }}>
                      {formatMoeda(converterMoeda(Math.max(0, falta), "pyg", moedaOp, cotacao), moedaOp)}
                    </span>
                  </div>
                  {troco > 0 && (
                    <div className="flex justify-between gap-3">
                      <span style={{ color: v("--text-muted") }}>{t("venda.change")}</span>
                      <span className="font-mono" style={{ color: v("--text") }}>{formatMoeda(converterMoeda(troco, "pyg", moedaOp, cotacao), moedaOp)}</span>
                    </div>
                  )}
                </>
              )}
              <div className={passo === "pagamento" ? "pt-2" : ""} style={passo === "pagamento" ? { borderTop: border1() } : undefined}>
                <p className="text-[11px] font-medium tracking-widest uppercase mb-1" style={{ color: v("--text-muted") }}>{t("venda.total")}</p>
                {descontoVenda > 0 && (
                  <p className="text-xs font-mono line-through mb-1" style={{ color: v("--text-muted") }}>
                    {formatMoeda(converterMoeda(totalPyg, "pyg", moedaOp, cotacao), moedaOp)}
                  </p>
                )}
                <p className="pdv-total font-mono">{formatMoeda(converterMoeda(totalLiquido, "pyg", moedaOp, cotacao), moedaOp)}</p>
                <EquivalentesMoeda valor={converterMoeda(totalLiquido, "pyg", moedaOp, cotacao)} de={moedaOp} cotacao={cotacao} />
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
            label: f.nome,
            selected: defId === f.id,
          }))}
        onPick={(id) => { setDefId(Number(id)); setListaFinalizador(false); setBuscaFinalizador(""); }}
        onClose={() => { setListaFinalizador(false); setBuscaFinalizador(""); }}
      />
      <SearchPickerModal
        open={listaCliente}
        title={t("venda.client")}
        searchPlaceholder={t("venda.clientSearchPlaceholder")}
        query={buscaCliente}
        onQueryChange={setBuscaCliente}
        items={itensCliente}
        onPick={(id) => { escolherCliente(Number(id)); setListaCliente(false); setBuscaCliente(""); }}
        onClose={() => { setListaCliente(false); setBuscaCliente(""); clienteRef.current?.focus(); }}
        emptyAction={{
          label: `+ ${t("venda.clienteRapido.new")}`,
          onClick: () => { setListaCliente(false); setModalCliente(true); },
        }}
      />
      <SearchPickerModal
        open={listaVendedor}
        title={t("venda.seller")}
        searchPlaceholder={t("venda.sellerSearchPlaceholder")}
        query={buscaVendedor}
        onQueryChange={setBuscaVendedor}
        items={itensVendedor}
        onPick={(id) => { setIdVendedor(Number(id)); setListaVendedor(false); setBuscaVendedor(""); }}
        onClose={() => { setListaVendedor(false); setBuscaVendedor(""); }}
      />
      {modalCliente && (
        <ClienteRapidoModal
          nomeInicial={buscaCliente}
          onClose={() => setModalCliente(false)}
          onCriado={(id) => void clienteRapidoCriado(id)}
        />
      )}
      {recibo && (
        <ReciboVenda venda={recibo} onClose={() => setRecibo(null)} />
      )}
    </div>
  );
}
