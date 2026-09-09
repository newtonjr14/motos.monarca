import type { Cotacao, Moeda } from "@/api";
import { converterMoeda, formatMoeda, MOEDAS } from "@/format";

const v = (name: string) => `var(${name})`;

export default function EquivalentesMoeda({
  valor,
  de,
  cotacao,
}: {
  valor: number;
  de: Moeda;
  cotacao: Cotacao | null;
}) {
  if (!cotacao || !Number.isFinite(valor) || valor <= 0) return null;
  const outras = MOEDAS.filter((m) => m !== de).map((m) => formatMoeda(converterMoeda(valor, de, m, cotacao), m));
  if (!outras.length) return null;
  return (
    <p className="text-xs mt-1" style={{ color: v("--text-muted") }}>{outras.join(" · ")}</p>
  );
}
