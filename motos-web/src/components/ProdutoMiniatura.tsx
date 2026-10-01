import { buscarFotoProduto, type Produto } from "@/api";
import { useEffect, useState } from "react";

const v = (name: string) => `var(${name})`;
const cache = new Map<number, string>();

export function invalidarFotoProduto(id: number) {
  const url = cache.get(id);
  if (url) URL.revokeObjectURL(url);
  cache.delete(id);
}

export function useFotoProduto(id: number, temFoto?: boolean) {
  const [src, setSrc] = useState<string | null>(temFoto ? cache.get(id) ?? null : null);
  useEffect(() => {
    if (!temFoto) {
      setSrc(null);
      return;
    }
    const guardada = cache.get(id);
    if (guardada) {
      setSrc(guardada);
      return;
    }
    let ativo = true;
    void buscarFotoProduto(id).then((url) => {
      if (!url) return;
      cache.set(id, url);
      if (ativo) setSrc(url);
      else URL.revokeObjectURL(url);
    });
    return () => { ativo = false; };
  }, [id, temFoto]);
  return src;
}

function IconeTipo({ tipo }: { tipo: Produto["tipo"] }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: v("--gold") }}>
      {tipo === "moto"
        ? <><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M8 17l3-8h5l3 8" /><path d="M6 11h4" /></>
        : <><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><path d="M6.5 15l5-9 6 9" /><path d="M11.5 6v9" /></>}
    </svg>
  );
}

export default function ProdutoMiniatura({ produto }: { produto: Produto }) {
  const src = useFotoProduto(produto.id, produto.temFoto);
  if (!src) return <IconeTipo tipo={produto.tipo} />;
  return <img src={src} alt="" className="w-full h-full object-cover" />;
}

export async function prepararFoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("foto"));
      el.src = url;
    });
    const max = 960;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("foto");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new Error("foto");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
