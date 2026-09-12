import { useCallback, useEffect, useMemo, useState } from "react";
import EquivalentesMoeda from "@/components/EquivalentesMoeda";
import { Field, FormTabs, navegarGuiaNoTeclado, Section } from "@/components/crud/Field";
import { CatalogHeader, ListToolbar, StatusBadge, StatusFilter, TableHeadRow, TablePagination, Td, passaFiltroStatus, useListSort, type FiltroStatus } from "@/components/crud/ListUi";
import ProdutoFicha from "@/components/ProdutoFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import {
  ApiError,
  atualizarProduto,
  atualizarProdutoStatus,
  buscarCotacaoHoje,
  buscarProduto,
  adicionarUnidades,
  criarProduto,
  excluirProduto,
  excluirUnidade,
  listarMarcas,
  listarModelos,
  listarEstoques,
  listarProdutos,
  listarUnidades,
  type Cotacao,
  type Marca,
  type Modelo,
  type Produto,
  type ProdutoUnidade,
  type TipoProduto,
  type VinculoFilialProdutoConflito,
} from "@/api";
import { CHASSI_MAXIMO, PAGE_SIZE, converterMoeda, expandirNumerosChassi, formatMoeda, moedaOperacaoDe, slicePage, toTitleCase } from "@/format";

const v = (name: string) => `var(${name})`;

type Specs = {
  cor: string;
  potenciaMotorW: string;
  autonomiaKm: string;
  velocidadeMaxKmh: string;
  capacidadeBateriaAh: string;
  voltagemBateria: string;
  tempoCargaHoras: string;
  pesoKg: string;
  capacidadeCargaKg: string;
  assentos: string;
  tipoFreio: string;
  aro: string;
  tipoQuadro: string;
  numeroMarchas: string;
  anoFabricacao: string;
  anoModelo: string;
  numeroSerieQuadro: string;
};

const specsVazio: Specs = {
  cor: "", potenciaMotorW: "", autonomiaKm: "", velocidadeMaxKmh: "",
  capacidadeBateriaAh: "", voltagemBateria: "", tempoCargaHoras: "", pesoKg: "",
  capacidadeCargaKg: "", assentos: "", tipoFreio: "", aro: "", tipoQuadro: "", numeroMarchas: "",
  anoFabricacao: "", anoModelo: "", numeroSerieQuadro: "",
};

function num(valor: string): number | null {
  const trimmed = valor.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function numerosDoLote(texto: string): { numeros: string[]; erro?: "CHASSI_INTERVALO_INVALIDO" | "CHASSI_INTERVALO_GRANDE" | "CHASSI_DUPLICADO"; duplicado?: string } {
  if (!texto.trim()) return { numeros: [] };
  const exp = expandirNumerosChassi(texto);
  if (!exp.ok) return { numeros: [], erro: exp.codigo };
  const seen = new Set<string>();
  for (const n of exp.numeros) {
    if (seen.has(n)) return { numeros: exp.numeros, erro: "CHASSI_DUPLICADO", duplicado: n };
    seen.add(n);
  }
  return { numeros: exp.numeros };
}

function LoteChassisField({
  value,
  onChange,
  aside,
}: {
  value: string;
  onChange: (v: string) => void;
  aside?: string;
}) {
  const { t } = useI18n();
  const lote = numerosDoLote(value);
  const erro = lote.erro === "CHASSI_INTERVALO_GRANDE"
    ? tf(t, "api.CHASSI_INTERVALO_GRANDE", { max: String(CHASSI_MAXIMO) })
    : lote.erro === "CHASSI_INTERVALO_INVALIDO"
      ? t("produto.error.chassiIntervalo")
      : lote.erro === "CHASSI_DUPLICADO"
        ? tf(t, "api.CHASSI_DUPLICADO", { chassi: lote.duplicado ?? "" })
        : undefined;
  const asideCount = !erro && lote.numeros.length
    ? `${aside ? `${aside} · ` : ""}${tf(t, "produto.chassiCount", { n: String(lote.numeros.length) })}`
    : aside;
  const primeiro = lote.numeros[0];
  const ultimo = lote.numeros[lote.numeros.length - 1];
  return (
    <Field label={t("produto.chassiLote")} hint={erro ? undefined : t("produto.chassiLoteHint")} error={erro} aside={asideCount}>
      <textarea
        className="field font-mono uppercase"
        rows={5}
        value={value}
        placeholder={t("produto.chassiLotePlaceholder")}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
      />
      {!erro && primeiro && ultimo && primeiro !== ultimo && (
        <p className="mt-1 text-xs font-mono" style={{ color: v("--text-muted") }}>
          {primeiro} → {ultimo}
        </p>
      )}
    </Field>
  );
}

function specsDe(item?: Produto | null): Specs {
  if (!item) return { ...specsVazio };
  if (item.tipo === "moto" && item.moto) {
    return {
      ...specsVazio,
      cor: item.moto.cor ?? "",
      potenciaMotorW: item.moto.potenciaMotorW?.toString() ?? "",
      autonomiaKm: item.moto.autonomiaKm?.toString() ?? "",
      velocidadeMaxKmh: item.moto.velocidadeMaxKmh?.toString() ?? "",
      capacidadeBateriaAh: item.moto.capacidadeBateriaAh?.toString() ?? "",
      voltagemBateria: item.moto.voltagemBateria?.toString() ?? "",
      tempoCargaHoras: item.moto.tempoCargaHoras?.toString() ?? "",
      pesoKg: item.moto.pesoKg?.toString() ?? "",
      capacidadeCargaKg: item.moto.capacidadeCargaKg?.toString() ?? "",
      assentos: item.moto.assentos?.toString() ?? "",
      tipoFreio: item.moto.tipoFreio ?? "",
      anoFabricacao: item.moto.anoFabricacao?.toString() ?? "",
      anoModelo: item.moto.anoModelo?.toString() ?? "",
    };
  }
  if (item.tipo === "bicicleta" && item.bicicleta) {
    return {
      ...specsVazio,
      cor: item.bicicleta.cor ?? "",
      potenciaMotorW: item.bicicleta.potenciaMotorW?.toString() ?? "",
      autonomiaKm: item.bicicleta.autonomiaKm?.toString() ?? "",
      capacidadeBateriaAh: item.bicicleta.capacidadeBateriaAh?.toString() ?? "",
      voltagemBateria: item.bicicleta.voltagemBateria?.toString() ?? "",
      tempoCargaHoras: item.bicicleta.tempoCargaHoras?.toString() ?? "",
      pesoKg: item.bicicleta.pesoKg?.toString() ?? "",
      tipoFreio: item.bicicleta.tipoFreio ?? "",
      aro: item.bicicleta.aro ?? "",
      tipoQuadro: item.bicicleta.tipoQuadro ?? "",
      numeroMarchas: item.bicicleta.numeroMarchas?.toString() ?? "",
      numeroSerieQuadro: item.bicicleta.numeroSerieQuadro ?? "",
    };
  }
  return { ...specsVazio };
}

function codigoSugerido(produtos: Produto[]): string {
  const usados = new Set(produtos.map((p) => p.codigo.trim().toUpperCase()));
  let n = produtos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  while (usados.has(String(n))) n += 1;
  return String(n);
}

export default function ProdutosPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const { filial } = useFilial();
  const moedaOp = moedaOperacaoDe(filial?.moedaOperacao);
  const [itens, setItens] = useState<Produto[]>([]);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [nome, setNome] = useState("");
  const [nomeManual, setNomeManual] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [codigoSugeridoAtual, setCodigoSugeridoAtual] = useState("");
  const [codigoManual, setCodigoManual] = useState(false);
  const [qtdInicial, setQtdInicial] = useState("0");
  const [estoquePadraoNome, setEstoquePadraoNome] = useState("");
  const [chassisTexto, setChassisTexto] = useState("");
  const [unidades, setUnidades] = useState<ProdutoUnidade[]>([]);
  const [loteNovo, setLoteNovo] = useState("");
  const [unidadesBusy, setUnidadesBusy] = useState(false);
  const [idMarca, setIdMarca] = useState<number | "">("");
  const [idModelo, setIdModelo] = useState<number | "">("");
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoProduto>("moto");
  const [controlaChassi, setControlaChassi] = useState(true);
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [specs, setSpecs] = useState<Specs>(specsVazio);
  const [aliquotaIva, setAliquotaIva] = useState<0 | 5 | 10>(10);
  const [precoLista, setPrecoLista] = useState("");
  const [custo, setCusto] = useState("");
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [guia, setGuia] = useState<"cadastro" | "ficha" | "preco" | "estoque">("cadastro");

  const resetLista = useCallback(() => {
    setFormAberto(false);
    setEditando(null);
    setSelected(null);
  }, []);
  useCrudReset(navReset, resetLista);

  async function carregar() {
    try {
      setErro(null);
      const [produtos, catalogo] = await Promise.all([listarProdutos(idFilial), listarMarcas()]);
      setItens(produtos);
      setMarcas(catalogo);
      try { setCotacao(await buscarCotacaoHoje()); } catch { setCotacao(null); }
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    } finally {
      setCarregando(false);
    }
  }
  useEffect(() => { void carregar(); }, [idFilial]);
  useEffect(() => {
    if (!formAberto || !editando || !controlaChassi) return;
    let ativo = true;
    void listarUnidades(editando.id, idFilial)
      .then((lista) => { if (ativo) setUnidades(lista); })
      .catch((e) => { if (ativo) setErro(mensagemErroApi(e, t, "common.error.loadFailed")); });
    return () => { ativo = false; };
  }, [formAberto, editando?.id, controlaChassi, idFilial, t]);
  useEffect(() => {
    if (idMarca === "") {
      setModelos([]);
      return;
    }
    void listarModelos(Number(idMarca), tipo).then(setModelos).catch(() => setModelos([]));
  }, [idMarca, tipo]);

  function preencher(item?: Produto | null, lista = itens) {
    setEditando(item ?? null);
    const composto = item ? `${item.marca} ${item.modelo}`.trim() : "";
    setNome(item?.nome ?? "");
    setNomeManual(Boolean(item?.nome && item.nome.trim() !== composto));
    if (item) {
      setCodigo(item.codigo);
      setCodigoSugeridoAtual("");
      setCodigoManual(true);
    } else {
      const sugerido = codigoSugerido(lista);
      setCodigoSugeridoAtual(sugerido);
      setCodigo(sugerido);
      setCodigoManual(false);
    }
    setQtdInicial("0");
    setChassisTexto("");
    setLoteNovo("");
    setUnidades([]);
    setIdMarca(item?.idMarca ?? "");
    setIdModelo(item?.idModelo ?? "");
    setDescricao(item?.descricao ?? "");
    setTipo(item?.tipo ?? "moto");
    setControlaChassi(item?.controlaChassi ?? (item?.tipo !== "bicicleta"));
    setStatus(item?.status === "inativo" ? "inativo" : "ativo");
    setAliquotaIva(item?.aliquotaIva === 0 || item?.aliquotaIva === 5 ? item.aliquotaIva : 10);
    if (item != null && item.moedaPreco !== moedaOp && cotacao) {
      const preco = converterMoeda(item.precoLista, item.moedaPreco, moedaOp, cotacao);
      const custoConv = converterMoeda(item.custo, item.moedaPreco, moedaOp, cotacao);
      setPrecoLista(moedaOp === "pyg" ? String(Math.round(preco)) : preco.toFixed(2));
      setCusto(moedaOp === "pyg" ? String(Math.round(custoConv)) : custoConv.toFixed(2));
    } else {
      setPrecoLista(item != null ? String(item.precoLista) : "");
      setCusto(item != null ? String(item.custo) : "");
    }
    setSpecs(specsDe(item));
    setErro(null);
    setGuia("cadastro");
    setFormAberto(true);
    setSelected(null);
  }

  async function abrir(item?: Produto) {
    if (!item) {
      preencher(null);
      const idPadrao = filial?.idEstoquePadrao;
      if (idPadrao) {
        try {
          const estoques = await listarEstoques(idFilial);
          setEstoquePadraoNome(estoques.find((e) => e.id === idPadrao)?.nome ?? "");
        } catch {
          setEstoquePadraoNome("");
        }
      } else {
        setEstoquePadraoNome("");
      }
      return;
    }
    setEstoquePadraoNome("");
    if (item.moto != null || item.bicicleta != null) {
      preencher(item);
      return;
    }
    try {
      preencher(await buscarProduto(item.id, idFilial));
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.loadFailed"));
    }
  }

  function setSpec<K extends keyof Specs>(key: K, value: string) {
    setSpecs((atual) => ({ ...atual, [key]: value }));
  }

  function corpo(confirmarVinculoFilial = false) {
    const moto = tipo === "moto" ? {
      cor: specs.cor.trim() || null,
      potenciaMotorW: num(specs.potenciaMotorW),
      autonomiaKm: num(specs.autonomiaKm),
      velocidadeMaxKmh: num(specs.velocidadeMaxKmh),
      capacidadeBateriaAh: num(specs.capacidadeBateriaAh),
      voltagemBateria: num(specs.voltagemBateria),
      tempoCargaHoras: num(specs.tempoCargaHoras),
      pesoKg: num(specs.pesoKg),
      capacidadeCargaKg: num(specs.capacidadeCargaKg),
      assentos: num(specs.assentos),
      tipoFreio: specs.tipoFreio.trim() || null,
      anoFabricacao: Number(specs.anoFabricacao),
      anoModelo: Number(specs.anoModelo),
    } : null;
    const bicicleta = tipo === "bicicleta" ? {
      cor: specs.cor.trim() || null,
      potenciaMotorW: num(specs.potenciaMotorW),
      autonomiaKm: num(specs.autonomiaKm),
      capacidadeBateriaAh: num(specs.capacidadeBateriaAh),
      voltagemBateria: num(specs.voltagemBateria),
      tempoCargaHoras: num(specs.tempoCargaHoras),
      pesoKg: num(specs.pesoKg),
      aro: specs.aro.trim() || null,
      tipoQuadro: specs.tipoQuadro.trim() || null,
      numeroMarchas: num(specs.numeroMarchas),
      tipoFreio: specs.tipoFreio.trim() || null,
      numeroSerieQuadro: specs.numeroSerieQuadro.trim().toUpperCase() || null,
    } : null;
    return {
      codigo: codigo.trim().toUpperCase(),
      nome: toTitleCase(nome.trim()),
      idMarca: Number(idMarca),
      idModelo: Number(idModelo),
      descricao: descricao.trim() || null,
      tipo,
      controlaChassi,
      status,
      idFilialCadastro: idFilial,
      confirmarVinculoFilial,
      aliquotaIva,
      moedaPreco: moedaOp,
      precoLista: num(precoLista) ?? 0,
      custo: num(custo) ?? 0,
      quantidadeInicial: editando || controlaChassi ? 0 : (Number.parseInt(qtdInicial, 10) || 0),
      numerosIniciais: !editando && controlaChassi ? numerosDoLote(chassisTexto).numeros : [],
      moto,
      bicicleta,
    };
  }

  async function salvar(confirmarVinculoFilial = false, novoDepois = false) {
    setErro(null);
    if (editando && !codigo.trim()) {
      setErro(t("produto.error.required"));
      setGuia("cadastro");
      return;
    }
    if (idMarca === "" || idModelo === "") {
      setErro(t("produto.error.required"));
      setGuia("cadastro");
      return;
    }
    if (!nome.trim()) {
      setErro(t("produto.error.nameRequired"));
      setGuia("cadastro");
      return;
    }
    if (tipo === "moto") {
      const fab = Number(specs.anoFabricacao);
      const mod = Number(specs.anoModelo);
      const maxAno = new Date().getFullYear() + 1;
      if (!Number.isInteger(fab) || !Number.isInteger(mod) || fab < 1990 || mod < 1990 || fab > maxAno || mod > maxAno || mod < fab) {
        setErro(t("produto.error.yearsRequired"));
        setGuia("ficha");
        return;
      }
    }
    const preco = num(precoLista);
    const custoN = num(custo);
    if (preco == null || preco < 0 || custoN == null || custoN < 0) {
      setErro(t("produto.error.price"));
      setGuia("preco");
      return;
    }
    if (!editando) {
      if (controlaChassi) {
        const lote = numerosDoLote(chassisTexto);
        if (lote.erro === "CHASSI_INTERVALO_GRANDE") {
          setErro(tf(t, "api.CHASSI_INTERVALO_GRANDE", { max: String(CHASSI_MAXIMO) }));
          setGuia("estoque");
          return;
        }
        if (lote.erro === "CHASSI_INTERVALO_INVALIDO") {
          setErro(t("produto.error.chassiIntervalo"));
          setGuia("estoque");
          return;
        }
        if (lote.erro === "CHASSI_DUPLICADO") {
          setErro(tf(t, "api.CHASSI_DUPLICADO", { chassi: lote.duplicado ?? "" }));
          setGuia("estoque");
          return;
        }
      } else {
        const qtd = qtdInicial.trim() === "" ? 0 : Number.parseInt(qtdInicial, 10);
        if (!Number.isInteger(qtd) || qtd < 0) {
          setErro(t("produto.error.qty"));
          setGuia("estoque");
          return;
        }
      }
    }
    setSalvando(true);
    try {
      if (editando) await atualizarProduto(editando.id, corpo());
      else await criarProduto(corpo(confirmarVinculoFilial));
      const lista = await listarProdutos(idFilial);
      setItens(lista);
      try { setCotacao(await buscarCotacaoHoje()); } catch { setCotacao(null); }
      if (novoDepois && !editando) {
        preencher(null, lista);
      } else {
        setFormAberto(false);
      }
    } catch (e) {
      if (!editando && e instanceof ApiError && e.status === 409) {
        const body = e.body as VinculoFilialProdutoConflito;
        if (body.codigo === "VINCULO_FILIAL") {
          const filiais = body.filiaisVinculadas.map((f) => f.nome).join(", ");
          if (confirm(tf(t, "produto.confirmLinkBranch", { codigo: body.produto.codigo, filiais }))) {
            setSalvando(false);
            await salvar(true, novoDepois);
            return;
          }
        }
      }
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setSalvando(false);
    }
  }

  async function recarregarEstoqueProduto() {
    if (!editando) return;
    const [produtos, detalhe, lista] = await Promise.all([
      listarProdutos(idFilial),
      buscarProduto(editando.id, idFilial),
      listarUnidades(editando.id, idFilial),
    ]);
    setItens(produtos);
    setEditando(detalhe);
    setUnidades(lista);
  }

  async function incluirChassis() {
    if (!editando) return;
    const lote = numerosDoLote(loteNovo);
    if (lote.erro === "CHASSI_INTERVALO_GRANDE") {
      setErro(tf(t, "api.CHASSI_INTERVALO_GRANDE", { max: String(CHASSI_MAXIMO) }));
      return;
    }
    if (lote.erro === "CHASSI_INTERVALO_INVALIDO") {
      setErro(t("produto.error.chassiIntervalo"));
      return;
    }
    if (lote.erro === "CHASSI_DUPLICADO") {
      setErro(tf(t, "api.CHASSI_DUPLICADO", { chassi: lote.duplicado ?? "" }));
      return;
    }
    if (!lote.numeros.length) {
      setErro(t("api.CHASSI_OBRIGATORIO"));
      return;
    }
    setUnidadesBusy(true);
    setErro(null);
    try {
      setUnidades(await adicionarUnidades(editando.id, { numeros: lote.numeros }));
      setLoteNovo("");
      await recarregarEstoqueProduto();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setUnidadesBusy(false);
    }
  }

  async function removerUnidade(idUnidade: number) {
    if (!editando) return;
    setUnidadesBusy(true);
    setErro(null);
    try {
      await excluirUnidade(editando.id, idUnidade);
      await recarregarEstoqueProduto();
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
    } finally {
      setUnidadesBusy(false);
    }
  }

  const marcaNome = marcas.find((m) => m.id === idMarca)?.nome
    ?? (editando?.idMarca === idMarca ? editando.marca : "");
  const modeloNome = modelos.find((m) => m.id === idModelo)?.nome
    ?? (editando?.idModelo === idModelo ? editando.modelo : "");
  const nomeComposto = [marcaNome, modeloNome].filter(Boolean).join(" ");
  const nomeDiverge = nome.trim() !== nomeComposto.trim();

  useEffect(() => {
    if (!nomeManual) setNome(nomeComposto);
  }, [nomeComposto, nomeManual]);

  const filtered = useMemo(() => itens.filter((p) =>
    passaFiltroStatus(p.status, filtroStatus) &&
    `${p.codigo} ${p.nome} ${p.marca} ${p.modelo} ${p.tipo}`.toLowerCase().includes(search.toLowerCase())), [itens, search, filtroStatus]);
  const valorSortProduto = useCallback((p: Produto, k: string) => {
    switch (k) {
      case "codigo": return p.codigo;
      case "nome": return p.nome;
      case "tipo": return p.tipo;
      case "precoLista": return p.precoLista;
      case "quantidadeDisponivel": return p.quantidadeDisponivel ?? 0;
      default: return p.id;
    }
  }, []);
  const { items: ordenados, sortKey, sortDir, onSort } = useListSort(filtered, valorSortProduto);
  const navIds = useMemo(() => ordenados.map((p) => p.id), [ordenados]);
  useEffect(() => { setPage(1); }, [search, filtroStatus, sortKey, sortDir]);
  useEffect(() => {
    if (selected != null && !filtered.some((p) => p.id === selected)) {
      setSelected(null);
    }
  }, [filtered, selected]);

  if (formAberto) {
    return (
      <div className="space-y-5 max-w-5xl">
        <button type="button" className="text-xs cursor-pointer" style={{ color: v("--text-muted") }} onClick={() => setFormAberto(false)}>
          ← {t("common.back")}
        </button>
        <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
          {editando ? t("produto.edit") : t("produto.new")}
        </h1>
        <form className="rounded-lg p-6 space-y-5" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}
          onSubmit={(e) => { e.preventDefault(); void salvar(); }}
          onKeyDown={(e) => navegarGuiaNoTeclado(e, ["cadastro", "ficha", "preco", "estoque"], guia, setGuia)}>
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
          <FormTabs
            value={guia}
            onChange={setGuia}
            tabs={[
              { id: "cadastro", label: t("produto.tab.cadastro") },
              { id: "ficha", label: t("produto.tab.ficha") },
              { id: "preco", label: t("produto.section.price") },
              { id: "estoque", label: t("produto.section.estoque") },
            ]}
          />
          <div role="tabpanel" id="form-panel-cadastro" aria-labelledby="form-tab-cadastro" hidden={guia !== "cadastro"} className="space-y-5">
          <Section title={t("produto.section.general")}>
            <div className="form-grid-2">
              <Field
                label={t("produto.codigo")}
                required
                aside={!editando && !codigoManual ? t("produto.codigoSuggested") : undefined}
              >
                <input
                  className={`field font-mono uppercase${!editando && !codigoManual ? " is-suggested" : ""}`}
                  autoFocus
                  value={codigo}
                  onFocus={(e) => { if (!editando && !codigoManual) e.currentTarget.select(); }}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setCodigo(v);
                    setCodigoManual(v.trim() !== codigoSugeridoAtual);
                  }}
                />
              </Field>
              <Field label={t("produto.tipo")} required>
                <select className="field" value={tipo} disabled={Boolean(editando)}
                  onChange={(e) => {
                    const proximo = e.target.value as TipoProduto;
                    setTipo(proximo);
                    setIdModelo("");
                    setChassisTexto("");
                    setLoteNovo("");
                    if (!editando) setControlaChassi(proximo === "moto");
                  }}>
                  <option value="moto">{t("produto.tipo.moto")}</option>
                  <option value="bicicleta">{t("produto.tipo.bicicleta")}</option>
                </select>
              </Field>
              <Field label={t("produto.controlaChassi")} hint={editando ? undefined : t("produto.controlaChassiHint")}>
                <label className="field flex items-center gap-2 cursor-pointer" style={{ background: editando ? v("--card2") : undefined }}>
                  <input
                    type="checkbox"
                    checked={controlaChassi}
                    disabled={Boolean(editando)}
                    onChange={(e) => {
                      setControlaChassi(e.target.checked);
                      setChassisTexto("");
                      setLoteNovo("");
                      if (!e.target.checked) setQtdInicial("0");
                    }}
                  />
                  <span className="text-sm" style={{ color: v("--text") }}>
                    {controlaChassi ? t("common.yes") : t("common.no")}
                  </span>
                </label>
              </Field>
              <Field label={t("produto.marca")} required>
                <select className="field" value={idMarca}
                  onChange={(e) => {
                    setIdMarca(e.target.value ? Number(e.target.value) : "");
                    setIdModelo("");
                  }}>
                  <option value="">{t("common.select")}</option>
                  {marcas.filter((m) => m.status === "ativo" || m.id === idMarca).map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("produto.modelo")} required>
                <select className="field" value={idModelo} disabled={idMarca === ""}
                  onChange={(e) => setIdModelo(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">{t("common.select")}</option>
                  {modelos.filter((m) => m.status === "ativo" || m.id === idModelo).map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("common.name")} required>
                <input className="field" maxLength={180} value={nome}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNome(v);
                    setNomeManual(v.trim() !== nomeComposto.trim());
                  }}
                  onBlur={() => {
                    const n = toTitleCase(nome);
                    setNome(n);
                    setNomeManual(n.trim() !== nomeComposto.trim());
                  }} />
                {nomeDiverge && (
                  <button type="button" className="mt-1 text-xs cursor-pointer" style={{ color: v("--gold") }}
                    onClick={() => { setNome(nomeComposto); setNomeManual(false); }}>
                    {t("produto.nomeRestore")}
                  </button>
                )}
              </Field>
            </div>
            <Field label={t("produto.descricao")}>
              <textarea className="field" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </Field>
            {editando && (
              <Field label={t("common.status")}>
                <select className="field" value={status} onChange={(e) => setStatus(e.target.value as "ativo" | "inativo")}>
                  <option value="ativo">{t("common.active")}</option>
                  <option value="inativo">{t("common.inactive")}</option>
                </select>
              </Field>
            )}
          </Section>
          </div>
          <div role="tabpanel" id="form-panel-ficha" aria-labelledby="form-tab-ficha" hidden={guia !== "ficha"}>
          <Section title={t("produto.tab.ficha")}>
            <div className="form-grid-2">
              {tipo === "moto" && (
                <>
                  <Field label={t("produto.anoFabricacao")} required>
                    <input className="field" inputMode="numeric" maxLength={4} value={specs.anoFabricacao}
                      onChange={(e) => setSpec("anoFabricacao", e.target.value.replace(/\D/g, "").slice(0, 4))} />
                  </Field>
                  <Field label={t("produto.anoModelo")} required>
                    <input className="field" inputMode="numeric" maxLength={4} value={specs.anoModelo}
                      onChange={(e) => setSpec("anoModelo", e.target.value.replace(/\D/g, "").slice(0, 4))} />
                  </Field>
                </>
              )}
              {tipo === "bicicleta" && (
                <Field label={t("produto.serieQuadro")}>
                  <input className="field font-mono uppercase" value={specs.numeroSerieQuadro}
                    onChange={(e) => setSpec("numeroSerieQuadro", e.target.value.toUpperCase())} />
                </Field>
              )}
              <Field label={t("produto.cor")}>
                <input className="field" value={specs.cor} onChange={(e) => setSpec("cor", e.target.value)}
                  onBlur={() => setSpec("cor", toTitleCase(specs.cor))} />
              </Field>
              <Field label={t("produto.potencia")}>
                <input className="field" inputMode="numeric" value={specs.potenciaMotorW}
                  onChange={(e) => setSpec("potenciaMotorW", e.target.value)} />
              </Field>
              <Field label={t("produto.autonomia")}>
                <input className="field" inputMode="numeric" value={specs.autonomiaKm}
                  onChange={(e) => setSpec("autonomiaKm", e.target.value)} />
              </Field>
              {tipo === "moto" && (
                <Field label={t("produto.velocidade")}>
                  <input className="field" inputMode="numeric" value={specs.velocidadeMaxKmh}
                    onChange={(e) => setSpec("velocidadeMaxKmh", e.target.value)} />
                </Field>
              )}
              <Field label={t("produto.bateria")}>
                <input className="field" inputMode="decimal" value={specs.capacidadeBateriaAh}
                  onChange={(e) => setSpec("capacidadeBateriaAh", e.target.value)} />
              </Field>
              <Field label={t("produto.voltagem")}>
                <input className="field" inputMode="numeric" value={specs.voltagemBateria}
                  onChange={(e) => setSpec("voltagemBateria", e.target.value)} />
              </Field>
              <Field label={t("produto.carga")}>
                <input className="field" inputMode="decimal" value={specs.tempoCargaHoras}
                  onChange={(e) => setSpec("tempoCargaHoras", e.target.value)} />
              </Field>
              <Field label={t("produto.peso")}>
                <input className="field" inputMode="decimal" value={specs.pesoKg}
                  onChange={(e) => setSpec("pesoKg", e.target.value)} />
              </Field>
              {tipo === "moto" && (
                <>
                  <Field label={t("produto.capacidadeCarga")}>
                    <input className="field" inputMode="numeric" value={specs.capacidadeCargaKg}
                      onChange={(e) => setSpec("capacidadeCargaKg", e.target.value)} />
                  </Field>
                  <Field label={t("produto.assentos")}>
                    <input className="field" inputMode="numeric" value={specs.assentos}
                      onChange={(e) => setSpec("assentos", e.target.value)} />
                  </Field>
                </>
              )}
              {tipo === "bicicleta" && (
                <>
                  <Field label={t("produto.aro")}>
                    <input className="field" value={specs.aro} onChange={(e) => setSpec("aro", e.target.value)} />
                  </Field>
                  <Field label={t("produto.quadro")}>
                    <input className="field" value={specs.tipoQuadro} onChange={(e) => setSpec("tipoQuadro", e.target.value)} />
                  </Field>
                  <Field label={t("produto.marchas")}>
                    <input className="field" inputMode="numeric" value={specs.numeroMarchas}
                      onChange={(e) => setSpec("numeroMarchas", e.target.value)} />
                  </Field>
                </>
              )}
              <Field label={t("produto.freio")}>
                <input className="field" value={specs.tipoFreio} onChange={(e) => setSpec("tipoFreio", e.target.value)} />
              </Field>
            </div>
          </Section>
          </div>
          <div role="tabpanel" id="form-panel-preco" aria-labelledby="form-tab-preco" hidden={guia !== "preco"}>
          <Section title={t("produto.section.price")}>
            <div className="form-grid-2">
              <Field label={t("produto.iva")} required>
                <select className="field" value={aliquotaIva} onChange={(e) => setAliquotaIva(Number(e.target.value) as 0 | 5 | 10)}>
                  <option value={10}>10%</option>
                  <option value={5}>5%</option>
                  <option value={0}>0%</option>
                </select>
              </Field>
              <Field label={t("empresa.moedaOperacao")}>
                <p className="field flex items-center" style={{ background: v("--card2") }}>
                  {moedaOp === "pyg" ? t("produto.currency.pyg") : moedaOp === "brl" ? t("produto.currency.brl") : t("produto.currency.usd")}
                </p>
              </Field>
              <Field label={t("produto.listPrice")} required>
                <input className="field font-mono" inputMode="decimal" value={precoLista} onChange={(e) => setPrecoLista(e.target.value)} />
                <EquivalentesMoeda valor={num(precoLista) ?? 0} de={moedaOp} cotacao={cotacao} />
              </Field>
              <Field label={t("produto.cost")} required>
                <input className="field font-mono" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value)} />
                <EquivalentesMoeda valor={num(custo) ?? 0} de={moedaOp} cotacao={cotacao} />
              </Field>
            </div>
          </Section>
          </div>
          <div role="tabpanel" id="form-panel-estoque" aria-labelledby="form-tab-estoque" hidden={guia !== "estoque"} className="space-y-3">
            <Section title={t("produto.section.estoque")}>
              {!editando ? (
                controlaChassi ? (
                  <LoteChassisField value={chassisTexto} onChange={setChassisTexto} aside={estoquePadraoNome || undefined} />
                ) : (
                  <Field label={t("produto.qtyInicial")} aside={estoquePadraoNome || undefined}>
                    <input
                      className="field font-mono"
                      inputMode="numeric"
                      value={qtdInicial}
                      onChange={(e) => setQtdInicial(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    />
                  </Field>
                )
              ) : (editando.estoques ?? []).length === 0 && !controlaChassi ? (
                <p className="text-sm" style={{ color: v("--text-muted") }}>{t("produto.noStock")}</p>
              ) : (
                <>
                  {(editando.estoques ?? []).length > 0 && (
                    <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${v("--border")}` }}>
                      <table className="drive-table w-full">
                        <thead>
                          <tr>
                            <th className="drive-th">{t("nav.estoques")}</th>
                            <th className="drive-th">{t("estoque.qty")}</th>
                            <th className="drive-th">{t("estoque.reserved")}</th>
                            <th className="drive-th">{t("estoque.available")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(editando.estoques ?? []).map((e) => (
                            <tr key={e.idEstoque} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                              <td className="drive-td text-xs font-medium" style={{ color: v("--text") }}>
                                {e.estoqueNome}
                                {e.padrao ? (
                                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: v("--gold") }}>
                                    {t("estoque.padraoBadge")}
                                  </span>
                                ) : null}
                              </td>
                              <td className="drive-td font-mono" style={{ color: v("--text-sub") }}>{e.quantidade}</td>
                              <td className="drive-td font-mono" style={{ color: v("--text-muted") }}>{e.quantidadeReservada}</td>
                              <td className="drive-td font-mono" style={{ color: v("--text") }}>{e.quantidadeDisponivel}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {controlaChassi ? (
                    <>
                      {unidades.length === 0 ? (
                        <p className="text-sm" style={{ color: v("--text-muted") }}>{t("produto.chassiEmpty")}</p>
                      ) : (
                        <div className="rounded-md overflow-auto max-h-72" style={{ border: `1px solid ${v("--border")}` }}>
                          <table className="drive-table w-full">
                            <thead>
                              <tr>
                                <th className="drive-th">{t("produto.chassiCodigo")}</th>
                                <th className="drive-th">{t("produto.chassi")}</th>
                                <th className="drive-th">{t("common.status")}</th>
                                <th className="drive-th">{t("col.actions")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {unidades.map((u) => (
                                <tr key={u.id} style={{ borderBottom: `1px solid ${v("--border")}` }}>
                                  <Td mono>{u.id}</Td>
                                  <Td mono>{u.numero}</Td>
                                  <td className="drive-td text-xs" style={{ color: u.situacao === "disponivel" ? v("--text") : v("--text-muted") }}>
                                    {t(u.situacao === "disponivel" ? "produto.situacao.disponivel" : "produto.situacao.vendido")}
                                  </td>
                                  <td className="drive-td">
                                    {u.situacao === "disponivel" ? (
                                      <button
                                        type="button"
                                        className="text-xs cursor-pointer"
                                        style={{ color: "var(--danger)" }}
                                        disabled={unidadesBusy}
                                        onClick={() => void removerUnidade(u.id)}
                                      >
                                        {t("common.delete")}
                                      </button>
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <LoteChassisField value={loteNovo} onChange={setLoteNovo} />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="btn-gold px-4 py-2 text-sm"
                          disabled={unidadesBusy || !loteNovo.trim()}
                          onClick={() => void incluirChassis()}
                        >
                          {unidadesBusy ? t("common.saving") : t("produto.chassiAdd")}
                        </button>
                      </div>
                      <p className="text-xs" style={{ color: v("--text-muted") }}>{t("produto.stockHintChassi")}</p>
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: v("--text-muted") }}>{t("produto.stockHint")}</p>
                  )}
                </>
              )}
            </Section>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
            {!editando && (
              <button type="button" disabled={salvando} className="btn-ghost px-4 py-2 text-sm"
                onClick={() => void salvar(false, true)}>
                {salvando ? t("common.saving") : t("common.saveAndNew")}
              </button>
            )}
            <button type="submit" disabled={salvando} className="btn-gold px-5 py-2 text-sm">{salvando ? t("common.saving") : t("common.save")}</button>
          </div>
        </form>
      </div>
    );
  }

  const paged = slicePage(ordenados, page);
  const navIndex = selected != null ? navIds.indexOf(selected) : -1;
  const selecionado = ordenados.find((p) => p.id === selected) ?? null;

  function navegarPara(index: number) {
    const id = navIds[index];
    if (id == null) return;
    setSelected(id);
    setPage(Math.floor(index / PAGE_SIZE) + 1);
  }

  async function alternarStatusProduto(item: Produto) {
    if (statusBusyId != null) return;
    const proximo = item.status === "ativo" ? "inativo" : "ativo";
    setErro(null);
    setStatusBusyId(item.id);
    setItens((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: proximo } : x)));
    try {
      await atualizarProdutoStatus(item.id, proximo);
    } catch (e) {
      setErro(mensagemErroApi(e, t, "common.error.saveFailed"));
      await carregar();
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.produtos")} count={itens.length} novoLabel={t("produto.new")} onNovo={() => void abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <ListToolbar>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("produto.searchPlaceholder")}
          className="px-3 py-2 text-sm rounded-md outline-none w-64"
          style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
        <StatusFilter value={filtroStatus} onChange={setFiltroStatus} />
      </ListToolbar>
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table drive-table-produtos w-full">
          <thead>
            <TableHeadRow
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              cols={[
                { label: "col.id", sort: "id" },
                { label: "col.code", sort: "codigo" },
                { label: "common.name", sort: "nome" },
                { label: "produto.tipo", sort: "tipo" },
                { label: "produto.listPrice", sort: "precoLista" },
                { label: "estoque.available", sort: "quantidadeDisponivel" },
                { label: "common.status" },
                "",
              ]}
            />
          </thead>
          <tbody>
            {paged.slice.map((p) => {
              const sel = selected === p.id;
              const nomeAuto = p.nome.trim() === `${p.marca} ${p.modelo}`.trim();
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelected(sel ? null : p.id)}
                  className={`drive-row-clickable${sel ? " drive-row-selected" : ""}`}
                  style={{ borderBottom: `1px solid ${v("--border")}` }}
                >
                  <Td mono gold>{p.id}</Td>
                  <Td mono>{p.codigo}</Td>
                  {nomeAuto ? (
                    <td className="drive-td drive-td-name" title={`${p.marca} ${p.modelo}`}>
                      <span className="produto-nome-linha">
                        <span className="produto-nome-marca">{p.marca}</span>
                        {" "}
                        <span className="produto-nome-modelo">{p.modelo}</span>
                      </span>
                    </td>
                  ) : (
                    <td className="drive-td drive-td-name text-[0.8125rem] font-medium" style={{ color: v("--text") }} title={p.nome}>{p.nome}</td>
                  )}
                  <Td sub>{p.tipo === "moto" ? t("produto.tipo.moto") : t("produto.tipo.bicicleta")}</Td>
                  <Td mono right>{formatMoeda(converterMoeda(p.precoLista, p.moedaPreco ?? "usd", moedaOp, cotacao), moedaOp)}</Td>
                  <Td mono right>{p.quantidadeDisponivel ?? 0} {t("estoque.unit")}</Td>
                  <td className="drive-td drive-td-status" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge
                      status={p.status === "inativo" ? "inativo" : "ativo"}
                      disabled={statusBusyId === p.id}
                      onToggle={() => void alternarStatusProduto(p)}
                    />
                  </td>
                  <td className="drive-td text-right">
                    <button className="text-xs cursor-pointer mr-3" style={{ color: v("--gold") }}
                      onClick={(e) => { e.stopPropagation(); void abrir(p); }}>{t("common.edit")}</button>
                    <button className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(tf(t, "common.confirmDelete", { name: p.nome }))) return;
                        try { await excluirProduto(p.id, idFilial); await carregar(); }
                        catch (err) { setErro(mensagemErroApi(err, t, "common.error.deleteFailed")); }
                      }}>{t("common.delete")}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {carregando && !itens.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.loading")}</div>}
        {!carregando && !filtered.length && <div className="py-12 text-center text-sm" style={{ color: v("--text-muted") }}>{t("common.noRecords")}</div>}
        {filtered.length > 0 && <TablePagination page={paged.pageSafe} total={paged.total} onPageChange={setPage} />}
      </div>
      {selecionado && (
        <ProdutoFicha
          id={selecionado.id}
          fallback={selecionado}
          nav={navIndex >= 0 ? {
            index: navIndex,
            total: navIds.length,
            onPrev: () => navegarPara(navIndex - 1),
            onNext: () => navegarPara(navIndex + 1),
          } : undefined}
          onClose={() => setSelected(null)}
          onEdit={(item) => void abrir(item)}
          onChanged={carregar}
        />
      )}
    </div>
  );
}
