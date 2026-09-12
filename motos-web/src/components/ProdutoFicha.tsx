import EquivalentesMoeda from "@/components/EquivalentesMoeda";
import { atualizarProdutoStatus, buscarProduto, excluirProduto, listarUnidades, type Produto, type ProdutoUnidade } from "@/api";
import { useFilial, useFilialId } from "@/auth/FilialContext";
import { useCotacaoHoje } from "@/components/CotacaoBanner";
import { FormTabs, Section } from "@/components/crud/Field";
import { StatusTexto, Td } from "@/components/crud/ListUi";
import { converterMoeda, formatMoeda, moedaOperacaoDe } from "@/format";
import { useI18n } from "@/i18n";
import { mensagemErroApi } from "@/i18n/apiMessages";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const v = (name: string) => `var(${name})`;
const border1 = () => `1px solid ${v("--border")}`;

function NavBtn({ label, disabled, onClick, children }: {
  label: string; disabled?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
      style={{ color: v("--text-muted"), background: v("--card2"), border: border1() }}
    >
      {children}
    </button>
  );
}

function Dado({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{label}</p>
      <p className="text-sm mt-1 break-words" style={{ color: v("--text") }}>{value}</p>
    </div>
  );
}

export default function ProdutoFicha({
  id,
  fallback,
  nav,
  onClose,
  onEdit,
  onChanged,
}: {
  id: number;
  fallback: Produto;
  nav?: { index: number; total: number; onPrev: () => void; onNext: () => void };
  onClose: () => void;
  onEdit: (item: Produto) => void;
  onChanged: () => Promise<void>;
}) {
  const { t } = useI18n();
  const idFilial = useFilialId();
  const { filial } = useFilial();
  const moedaOp = moedaOperacaoDe(filial?.moedaOperacao);
  const { cotacao } = useCotacaoHoje();
  const [item, setItem] = useState<Produto>(fallback);
  const [unidades, setUnidades] = useState<ProdutoUnidade[]>([]);
  const [guia, setGuia] = useState<"dados" | "estoque">("dados");
  const [carregando, setCarregando] = useState(() => fallback.moto == null && fallback.bicicleta == null);
  const [loading, setLoading] = useState<"status" | "delete" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const completo = item.moto != null || item.bicicleta != null;

  useEffect(() => {
    let ativo = true;
    setItem(fallback);
    setErro(null);
    const precisaDetalhe = fallback.moto == null && fallback.bicicleta == null;
    if (precisaDetalhe) setCarregando(true);
    void buscarProduto(id, idFilial)
      .then((detalhe) => { if (ativo) setItem(detalhe); })
      .catch((e) => { if (ativo) setErro(mensagemErroApi(e, t, "common.error.loadFailed")); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [id, idFilial, fallback.id, t]);

  useEffect(() => {
    if (!item.controlaChassi) {
      setUnidades([]);
      return;
    }
    let ativo = true;
    void listarUnidades(id, idFilial)
      .then((lista) => { if (ativo) setUnidades(lista); })
      .catch(() => { if (ativo) setUnidades([]); });
    return () => { ativo = false; };
  }, [id, idFilial, item.controlaChassi]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (nav && !loading) {
        if (e.key === "ArrowUp" && nav.index > 0) {
          e.preventDefault();
          nav.onPrev();
        }
        if (e.key === "ArrowDown" && nav.index < nav.total - 1) {
          e.preventDefault();
          nav.onNext();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, nav, loading]);

  async function alternarStatus() {
    if (!completo) return;
    const proximo = item.status === "ativo" ? "inativo" : "ativo";
    const msg = proximo === "inativo" ? t("ficha.confirmInactivate") : t("ficha.confirmActivate");
    if (!confirm(msg)) return;
    setLoading("status");
    try {
      const atualizado = await atualizarProdutoStatus(item.id, proximo);
      setItem((prev) => ({ ...prev, ...atualizado, moto: prev.moto, bicicleta: prev.bicicleta, estoques: prev.estoques }));
      await onChanged();
    } finally {
      setLoading(null);
    }
  }

  async function excluir() {
    if (!confirm(t("ficha.confirmDeleteBranch"))) return;
    setLoading("delete");
    try {
      await excluirProduto(item.id, idFilial);
      onClose();
      await onChanged();
    } finally {
      setLoading(null);
    }
  }

  const specs = item.tipo === "moto" ? item.moto : item.bicicleta;
  const disponivel = item.quantidadeDisponivel ?? fallback.quantidadeDisponivel ?? 0;
  const estoques = item.estoques ?? [];

  return createPortal(
    <div
      className="ficha-modal-overlay fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="produto-ficha-title"
    >
      <div
        className="ficha-modal ficha-modal-locked w-full max-w-2xl rounded-xl shadow-2xl flex flex-col"
        style={{ background: v("--card"), border: border1() }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ficha-modal-header px-6 py-4 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: border1() }}>
          <div className="min-w-0 space-y-2">
            <p id="produto-ficha-title" className="text-lg font-semibold leading-snug truncate" style={{ fontFamily: "var(--font-display)", color: v("--text") }}>
              {item.nome}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusTexto status={item.status} />
              <span className="text-xs" style={{ color: v("--text-sub") }}>
                {item.tipo === "moto" ? t("produto.tipo.moto") : t("produto.tipo.bicicleta")}
                {item.nome.trim() !== `${item.marca} ${item.modelo}`.trim()
                  ? ` · ${item.marca} ${item.modelo}`
                  : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {nav && nav.total > 1 && (
              <>
                <NavBtn label={t("ficha.prev")} disabled={nav.index <= 0} onClick={nav.onPrev}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </NavBtn>
                <span className="text-xs tabular-nums px-1 min-w-[3rem] text-center" style={{ color: v("--text-muted") }}>
                  {nav.index + 1} / {nav.total}
                </span>
                <NavBtn label={t("ficha.next")} disabled={nav.index >= nav.total - 1} onClick={nav.onNext}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </NavBtn>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-lg leading-none"
              style={{ color: v("--text-muted"), background: v("--card2"), border: border1() }}
              aria-label={t("ficha.close")}
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-3 shrink-0 flex items-start justify-between gap-4" style={{ background: v("--card2"), borderBottom: border1() }}>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>
              {t("produto.codigo")}
            </p>
            <p className="text-sm font-mono mt-0.5" style={{ color: v("--text") }}>{item.codigo}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>
              {t("estoque.available")}
            </p>
            <p className="text-sm font-mono mt-0.5 tabular-nums" style={{ color: v("--text") }}>{disponivel}</p>
          </div>
        </div>

        <div className="ficha-modal-tabs px-6 shrink-0">
          <FormTabs
            tabs={[
              { id: "dados", label: t("ficha.tab.dados") },
              { id: "estoque", label: t("ficha.tab.estoque") },
            ]}
            value={guia}
            onChange={setGuia}
          />
        </div>

        <div className="ficha-modal-body px-6 py-5 space-y-5">
          {erro && <p className="text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

          {guia === "dados" && (
            <>
              <Section title={t("produto.section.price")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Dado label={t("produto.iva")} value={`${item.aliquotaIva ?? 10}%`} />
                  <Dado
                    label={t("empresa.moedaOperacao")}
                    value={moedaOp === "pyg" ? t("produto.currency.pyg") : moedaOp === "brl" ? t("produto.currency.brl") : t("produto.currency.usd")}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{t("produto.listPrice")}</p>
                    <p className="text-sm mt-1 font-mono" style={{ color: v("--text") }}>
                      {formatMoeda(converterMoeda(item.precoLista ?? 0, item.moedaPreco ?? "usd", moedaOp, cotacao), moedaOp)}
                    </p>
                    <EquivalentesMoeda valor={converterMoeda(item.precoLista ?? 0, item.moedaPreco ?? "usd", moedaOp, cotacao)} de={moedaOp} cotacao={cotacao} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: v("--text-muted") }}>{t("produto.cost")}</p>
                    <p className="text-sm mt-1 font-mono" style={{ color: v("--text") }}>
                      {formatMoeda(converterMoeda(item.custo ?? 0, item.moedaPreco ?? "usd", moedaOp, cotacao), moedaOp)}
                    </p>
                    <EquivalentesMoeda valor={converterMoeda(item.custo ?? 0, item.moedaPreco ?? "usd", moedaOp, cotacao)} de={moedaOp} cotacao={cotacao} />
                  </div>
                </div>
              </Section>

              {item.descricao && (
                <Section title={t("produto.descricao")}>
                  <p className="text-sm leading-relaxed break-words" style={{ color: v("--text") }}>{item.descricao}</p>
                </Section>
              )}

              <Section title={item.tipo === "moto" ? t("produto.section.moto") : t("produto.section.bicicleta")}>
                {!completo ? (
                  <p className="text-sm italic" style={{ color: v("--text-muted") }}>{t("common.loading")}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {item.tipo === "moto" && item.moto && (
                      <>
                        <Dado label={`${t("produto.anoFabricacao")} / ${t("produto.anoModelo")}`}
                          value={`${item.moto.anoFabricacao}/${item.moto.anoModelo}`} />
                        <Dado label={t("produto.cor")} value={item.moto.cor} />
                        <Dado label={t("produto.potencia")} value={item.moto.potenciaMotorW} />
                        <Dado label={t("produto.autonomia")} value={item.moto.autonomiaKm} />
                        <Dado label={t("produto.velocidade")} value={item.moto.velocidadeMaxKmh} />
                        <Dado label={t("produto.bateria")} value={item.moto.capacidadeBateriaAh} />
                        <Dado label={t("produto.voltagem")} value={item.moto.voltagemBateria} />
                        <Dado label={t("produto.carga")} value={item.moto.tempoCargaHoras} />
                        <Dado label={t("produto.peso")} value={item.moto.pesoKg} />
                        <Dado label={t("produto.capacidadeCarga")} value={item.moto.capacidadeCargaKg} />
                        <Dado label={t("produto.assentos")} value={item.moto.assentos} />
                        <Dado label={t("produto.freio")} value={item.moto.tipoFreio} />
                      </>
                    )}
                    {item.tipo === "bicicleta" && item.bicicleta && (
                      <>
                        <Dado label={t("produto.serieQuadro")} value={item.bicicleta.numeroSerieQuadro} />
                        <Dado label={t("produto.cor")} value={item.bicicleta.cor} />
                        <Dado label={t("produto.potencia")} value={item.bicicleta.potenciaMotorW} />
                        <Dado label={t("produto.autonomia")} value={item.bicicleta.autonomiaKm} />
                        <Dado label={t("produto.bateria")} value={item.bicicleta.capacidadeBateriaAh} />
                        <Dado label={t("produto.voltagem")} value={item.bicicleta.voltagemBateria} />
                        <Dado label={t("produto.carga")} value={item.bicicleta.tempoCargaHoras} />
                        <Dado label={t("produto.peso")} value={item.bicicleta.pesoKg} />
                        <Dado label={t("produto.aro")} value={item.bicicleta.aro} />
                        <Dado label={t("produto.quadro")} value={item.bicicleta.tipoQuadro} />
                        <Dado label={t("produto.marchas")} value={item.bicicleta.numeroMarchas} />
                        <Dado label={t("produto.freio")} value={item.bicicleta.tipoFreio} />
                      </>
                    )}
                    {completo && specs && Object.values(specs).every((x) => x == null || x === "") && (
                      <p className="text-sm italic sm:col-span-2" style={{ color: v("--text-muted") }}>{t("ficha.notInformed")}</p>
                    )}
                  </div>
                )}
              </Section>
            </>
          )}

          {guia === "estoque" && (
            <>
              <Section title={t("produto.section.estoque")}>
                {carregando && estoques.length === 0 ? (
                  <p className="text-sm italic" style={{ color: v("--text-muted") }}>{t("common.loading")}</p>
                ) : estoques.length === 0 ? (
                  <p className="text-sm italic" style={{ color: v("--text-muted") }}>{t("produto.noStock")}</p>
                ) : (
                  <div className="rounded-md overflow-hidden" style={{ border: border1() }}>
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
                        {estoques.map((e) => (
                          <tr key={e.idEstoque} style={{ borderBottom: border1() }}>
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
              </Section>
              {item.controlaChassi && (
                <Section title={t("produto.chassiLote")}>
                  {unidades.length === 0 ? (
                    <p className="text-sm italic" style={{ color: v("--text-muted") }}>{t("produto.chassiEmpty")}</p>
                  ) : (
                    <div className="rounded-md overflow-auto max-h-56" style={{ border: border1() }}>
                      <table className="drive-table w-full">
                        <thead>
                          <tr>
                            <th className="drive-th">{t("produto.chassiCodigo")}</th>
                            <th className="drive-th">{t("produto.chassi")}</th>
                            <th className="drive-th">{t("common.status")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unidades.map((u) => (
                            <tr key={u.id} style={{ borderBottom: border1() }}>
                              <Td mono>{u.id}</Td>
                              <Td mono>{u.numero}</Td>
                              <td className="drive-td text-xs" style={{ color: v("--text-sub") }}>
                                {t(u.situacao === "disponivel" ? "produto.situacao.disponivel" : "produto.situacao.vendido")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>
              )}
              <Section title={t("ficha.stockLog")}>
                <p className="text-sm italic" style={{ color: v("--text-muted") }}>{t("ficha.stockLogSoon")}</p>
              </Section>
            </>
          )}
        </div>

        <div className="ficha-modal-actions px-6 py-3 shrink-0" style={{ borderTop: border1(), background: v("--card2") }}>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" className="btn-action-edit flex-1 py-2 text-sm order-1" disabled={!completo}
              onClick={() => onEdit(item)}>
              {t("common.edit")}
            </button>
            <button
              type="button"
              className="btn-action-secondary flex-1 py-2 text-sm order-2"
              disabled={loading != null || !completo}
              onClick={() => void alternarStatus()}
            >
              {loading === "status" ? t("common.saving") : item.status === "ativo" ? t("ficha.inactivate") : t("ficha.activate")}
            </button>
            <button
              type="button"
              className="btn-action-danger flex-1 py-2 text-sm order-3"
              disabled={loading != null}
              onClick={() => void excluir()}
            >
              {loading === "delete" ? t("common.saving") : t("common.delete")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
