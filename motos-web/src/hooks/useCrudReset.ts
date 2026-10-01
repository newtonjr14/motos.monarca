import { useEffect, useRef } from "react";

/** Volta à lista quando o usuário clica de novo no mesmo item do menu. */
export function useCrudReset(resetSignal: number, onReset: () => void) {
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;
  useEffect(() => {
    if (resetSignal > 0) onResetRef.current();
  }, [resetSignal]);
}
