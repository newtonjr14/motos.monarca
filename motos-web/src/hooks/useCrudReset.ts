import { useEffect } from "react";

/** Volta à lista quando o usuário clica de novo no mesmo item do menu. */
export function useCrudReset(resetSignal: number, onReset: () => void) {
  useEffect(() => {
    if (resetSignal > 0) onReset();
  }, [resetSignal, onReset]);
}
