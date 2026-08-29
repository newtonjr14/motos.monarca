export type SystemStatus = "online" | "offline" | "checking";

let status: SystemStatus = "checking";
const listeners = new Set<(s: SystemStatus) => void>();

export function getSystemStatus(): SystemStatus {
  return status;
}

export function subscribeSystemStatus(listener: (s: SystemStatus) => void): () => void {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
}

function emit(next: SystemStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l(status));
}

export function markSystemOnline() {
  emit("online");
}

export function markSystemOffline() {
  emit("offline");
}

export function markSystemChecking() {
  emit("checking");
}

export async function checkSystemHealth(): Promise<boolean> {
  try {
    const res = await fetch("/health", { method: "GET" });
    if (!res.ok) {
      markSystemOffline();
      return false;
    }
    markSystemOnline();
    return true;
  } catch {
    markSystemOffline();
    return false;
  }
}

export const HEARTBEAT_MS = 60_000;
