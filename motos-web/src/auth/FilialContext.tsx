import { useAuth } from "@/auth/AuthContext";
import type { FilialAcesso } from "@/api";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const LEGACY_KEY = "monarca.filialAtiva";
const keyFor = (userId: number) => `monarca.filialAtiva.${userId}`;

function lerSalva(userId: number): number | null {
  const raw = localStorage.getItem(keyFor(userId)) ?? localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return !Number.isNaN(id) && id > 0 ? id : null;
}

function gravar(userId: number, id: number) {
  localStorage.setItem(keyFor(userId), String(id));
  localStorage.removeItem(LEGACY_KEY);
}

type FilialContextValue = {
  filiais: FilialAcesso[];
  filial: FilialAcesso | null;
  precisaEscolher: boolean;
  semAcesso: boolean;
  escolher: (id: number) => void;
};

const FilialContext = createContext<FilialContextValue | null>(null);

export function FilialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userId, setUserId] = useState<number | null>(null);
  const [ativoId, setAtivoId] = useState<number | null>(null);

  const filiais = user?.filiais ?? [];

  let candidate = ativoId;
  if (user?.id !== userId) {
    setUserId(user?.id ?? null);
    candidate = user ? lerSalva(user.id) : null;
    setAtivoId(candidate);
  }

  const salva = filiais.find((f) => f.id === candidate) ?? null;
  const filial = salva ?? (filiais.length === 1 ? filiais[0]! : null);

  if (user && filial && candidate !== filial.id) {
    setAtivoId(filial.id);
    gravar(user.id, filial.id);
  }

  const escolher = useCallback(
    (id: number) => {
      if (!user) return;
      if (!(user.filiais ?? []).some((f) => f.id === id)) return;
      gravar(user.id, id);
      setAtivoId(id);
    },
    [user],
  );

  const value = useMemo<FilialContextValue>(
    () => ({
      filiais,
      filial,
      precisaEscolher: !!user && filiais.length > 1 && filial == null,
      semAcesso: !!user && filiais.length === 0,
      escolher,
    }),
    [filiais, filial, user, escolher],
  );

  return <FilialContext.Provider value={value}>{children}</FilialContext.Provider>;
}

export function useFilial() {
  const ctx = useContext(FilialContext);
  if (!ctx) throw new Error("useFilial must be used within FilialProvider");
  return ctx;
}

export function useFilialId(): number {
  const { filial } = useFilial();
  if (!filial) throw new Error("Filial não selecionada");
  return filial.id;
}
