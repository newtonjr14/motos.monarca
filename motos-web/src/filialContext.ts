import { buscarFilialPrincipal } from "@/api";

const FILIAL_KEY = "monarca.filialAtiva";

export async function obterFilialAtivaId(): Promise<number> {
  const saved = localStorage.getItem(FILIAL_KEY);
  if (saved) {
    const id = Number(saved);
    if (!Number.isNaN(id) && id > 0) return id;
  }
  const principal = await buscarFilialPrincipal();
  localStorage.setItem(FILIAL_KEY, String(principal.id));
  return principal.id;
}

export function definirFilialAtiva(id: number) {
  localStorage.setItem(FILIAL_KEY, String(id));
}

export function limparFilialAtiva() {
  localStorage.removeItem(FILIAL_KEY);
}
