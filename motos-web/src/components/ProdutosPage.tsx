import { useCallback, useEffect, useMemo, useState } from "react";
import EquivalentesMoeda from "@/components/EquivalentesMoeda";
import { Field, FormTabs, navegarGuiaNoTeclado, Section } from "@/components/crud/Field";
import { CatalogHeader, StatusBadge, TableHeadRow, TablePagination, Td } from "@/components/crud/ListUi";
import ProdutoFicha from "@/components/ProdutoFicha";
import { useCrudReset } from "@/hooks/useCrudReset";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { tf } from "@/i18n/format";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import {
  ApiError,
  atualizarProduto,
  buscarCotacaoHoje,
  buscarProduto,
  criarProduto,
  excluirProduto,
  listarMarcas,
  listarModelos,
  listarProdutos,
  type Cotacao,
  type Marca,
  type Modelo,
  type Produto,
  type TipoProduto,
  type VinculoFilialProdutoConflito,
} from "@/api";
import { PAGE_SIZE, converterMoeda, formatMoeda, moedaOperacaoDe, slicePage, toTitleCase } from "@/format";

const v = (name: string) => `var(${name})`;

type Specs = {
  chassi: string;
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
  chassi: "", cor: "", potenciaMotorW: "", autonomiaKm: "", velocidadeMaxKmh: "",
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

function specsDe(item?: Produto | null): Specs {
  if (!item) return { ...specsVazio };
  if (item.tipo === "moto" && item.moto) {
    return {
      ...specsVazio,
      chassi: item.moto.chassi ?? "",
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

export default function ProdutosPage({ navReset }: { navReset: number }) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const { filial } = useFilial();
  const moedaOp = moedaOperacaoDe(filial?.moedaOperacao);
  const [itens, setItens] = useState<Produto[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [codigo, setCodigo] = useState("");
  const [idMarca, setIdMarca] = useState<number | "">("");
  const [idModelo, setIdModelo] = useState<number | "">("");
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoProduto>("moto");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [specs, setSpecs] = useState<Specs>(specsVazio);
  const [aliquotaIva, setAliquotaIva] = useState<0 | 5 | 10>(10);
  const [precoLista, setPrecoLista] = useState("");
  const [custo, setCusto] = useState("");
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [salvando, setSalvando] = useState(false);
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
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    if (idMarca === "") {
      setModelos([]);
      return;
    }
    void listarModelos(Number(idMarca), tipo).then(setModelos).catch(() => setModelos([]));
  }, [idMarca, tipo]);

  function preencher(item?: Produto | null) {
    setEditando(item ?? null);
    setCodigo(item?.codigo ?? "");
    setIdMarca(item?.idMarca ?? "");
    setIdModelo(item?.idModelo ?? "");
    setDescricao(item?.descricao ?? "");
    setTipo(item?.tipo ?? "moto");
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
      return;
    }
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
      chassi: specs.chassi.trim() || null,
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
      idMarca: Number(idMarca),
      idModelo: Number(idModelo),
      descricao: descricao.trim() || null,
      tipo,
      status,
      idFilialCadastro: idFilial,
      confirmarVinculoFilial,
      aliquotaIva,
      moedaPreco: moedaOp,
      precoLista: num(precoLista) ?? 0,
      custo: num(custo) ?? 0,
      moto,
      bicicleta,
    };
  }

  async function salvar(confirmarVinculoFilial = false, novoDepois = false) {
    setErro(null);
    if (!codigo.trim() || idMarca === "" || idModelo === "") {
      setErro(t("produto.error.required"));
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
    setSalvando(true);
    try {
      if (editando) await atualizarProduto(editando.id, corpo());
      else await criarProduto(corpo(confirmarVinculoFilial));
      if (novoDepois && !editando) {
        preencher(null);
        await carregar();
      } else {
        setFormAberto(false);
        await carregar();
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

  const marcaNome = marcas.find((m) => m.id === idMarca)?.nome
    ?? (editando?.idMarca === idMarca ? editando.marca : "");
  const modeloNome = modelos.find((m) => m.id === idModelo)?.nome
    ?? (editando?.idModelo === idModelo ? editando.modelo : "");
  const nomeComposto = [marcaNome, modeloNome].filter(Boolean).join(" ");

  const filtered = useMemo(() => itens.filter((p) =>
    `${p.codigo} ${p.nome} ${p.marca} ${p.modelo} ${p.tipo}`.toLowerCase().includes(search.toLowerCase())), [itens, search]);
  const navIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
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
              <Field label={t("produto.codigo")} required hint={t("produto.codigoHint")}>
                <input className="field font-mono uppercase" autoFocus value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
              </Field>
              <Field label={t("produto.tipo")} required>
                <select className="field" value={tipo} disabled={Boolean(editando)}
                  onChange={(e) => {
                    setTipo(e.target.value as TipoProduto);
                    setIdModelo("");
                  }}>
                  <option value="moto">{t("produto.tipo.moto")}</option>
                  <option value="bicicleta">{t("produto.tipo.bicicleta")}</option>
                </select>
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
              <Field label={t("common.name")} hint={t("produto.nomeHint")}>
                <input className="field" readOnly value={nomeComposto} />
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
                  <Field label={t("produto.chassi")}>
                    <input className="field font-mono uppercase" value={specs.chassi}
                      onChange={(e) => setSpec("chassi", e.target.value.toUpperCase())} />
                  </Field>
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
              <Field label={t("produto.iva")} required hint={t("produto.ivaHint")}>
                <select className="field" value={aliquotaIva} onChange={(e) => setAliquotaIva(Number(e.target.value) as 0 | 5 | 10)}>
                  <option value={10}>10%</option>
                  <option value={5}>5%</option>
                  <option value={0}>0%</option>
                </select>
              </Field>
              <Field label={t("empresa.moedaOperacao")} hint={t("empresa.moedaOperacao.hint")}>
                <p className="field flex items-center" style={{ background: v("--card2") }}>
                  {moedaOp === "pyg" ? t("produto.currency.pyg") : moedaOp === "brl" ? t("produto.currency.brl") : t("produto.currency.usd")}
                </p>
              </Field>
              <Field label={t("produto.listPrice")} required hint={t("produto.listPriceHint")}>
                <input className="field font-mono" inputMode="decimal" value={precoLista} onChange={(e) => setPrecoLista(e.target.value)} />
                <EquivalentesMoeda valor={num(precoLista) ?? 0} de={moedaOp} cotacao={cotacao} />
              </Field>
              <Field label={t("produto.cost")} required hint={t("produto.costHint")}>
                <input className="field font-mono" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value)} />
                <EquivalentesMoeda valor={num(custo) ?? 0} de={moedaOp} cotacao={cotacao} />
              </Field>
            </div>
          </Section>
          </div>
          <div role="tabpanel" id="form-panel-estoque" aria-labelledby="form-tab-estoque" hidden={guia !== "estoque"} className="space-y-3">
            <Section title={t("produto.section.estoque")}>
              {!editando ? (
                <p className="text-sm" style={{ color: v("--text-muted") }}>{t("produto.stockAfterSave")}</p>
              ) : (editando.estoques ?? []).length === 0 ? (
                <p className="text-sm" style={{ color: v("--text-muted") }}>{t("produto.noStock")}</p>
              ) : (
                <>
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
                            <td className="drive-td text-xs font-medium" style={{ color: v("--text") }}>{e.estoqueNome}</td>
                            <td className="drive-td font-mono" style={{ color: v("--text-sub") }}>{e.quantidade}</td>
                            <td className="drive-td font-mono" style={{ color: v("--text-muted") }}>{e.quantidadeReservada}</td>
                            <td className="drive-td font-mono" style={{ color: v("--text") }}>{e.quantidadeDisponivel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs" style={{ color: v("--text-muted") }}>{t("produto.stockHint")}</p>
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

  const paged = slicePage(filtered, page);
  const navIndex = selected != null ? navIds.indexOf(selected) : -1;
  const selecionado = filtered.find((p) => p.id === selected) ?? null;

  function navegarPara(index: number) {
    const id = navIds[index];
    if (id == null) return;
    setSelected(id);
    setPage(Math.floor(index / PAGE_SIZE) + 1);
  }

  return (
    <div className="space-y-5">
      <CatalogHeader titulo={t("nav.produtos")} count={itens.length} novoLabel={t("produto.new")} onNovo={() => void abrir()} />
      {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")}
        className="px-3 py-2 text-sm rounded-md outline-none w-64"
        style={{ background: v("--card"), border: `1px solid ${v("--border")}`, color: v("--text") }} />
      <div className="rounded-lg overflow-hidden" style={{ background: v("--card"), border: `1px solid ${v("--border")}` }}>
        <table className="drive-table w-full">
          <thead>
            <TableHeadRow cols={["col.id", "col.code", "common.name", "produto.marca", "produto.tipo", "produto.listPrice", "estoque.available", "common.status", ""]} />
          </thead>
          <tbody>
            {paged.slice.map((p) => {
              const sel = selected === p.id;
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelected(sel ? null : p.id)}
                  className={`drive-row-clickable${sel ? " drive-row-selected" : ""}`}
                  style={{ borderBottom: `1px solid ${v("--border")}` }}
                >
                  <Td mono gold>{p.id}</Td>
                  <Td mono>{p.codigo}</Td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: v("--text") }}>{p.nome}</td>
                  <Td sub>{p.marca}</Td>
                  <Td sub>{p.tipo === "moto" ? t("produto.tipo.moto") : t("produto.tipo.bicicleta")}</Td>
                  <Td mono>{formatMoeda(converterMoeda(p.precoLista, p.moedaPreco ?? "usd", moedaOp, cotacao), moedaOp)}</Td>
                  <Td mono>{p.quantidadeDisponivel ?? 0}</Td>
                  <td className="px-4 py-3"><StatusBadge status={p.status === "inativo" ? "inativo" : "ativo"} /></td>
                  <td className="px-4 py-3 text-right">
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
