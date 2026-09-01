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

export const HEARTBEAT_MS = 30_000;
const OFFLINE_AFTER_FAILURES = 2;

let healthFailures = 0;

export async function checkSystemHealth(): Promise<boolean> {
  try {
    const res = await fetch("/health", { method: "GET" });
    if (!res.ok) {
      healthFailures += 1;
      if (healthFailures >= OFFLINE_AFTER_FAILURES) markSystemOffline();
      return false;
    }
    healthFailures = 0;
    markSystemOnline();
    return true;
  } catch {
    healthFailures += 1;
    if (healthFailures >= OFFLINE_AFTER_FAILURES) markSystemOffline();
    return false;
  }
}
