import { checkSystemHealth, HEARTBEAT_MS, subscribeSystemStatus, type SystemStatus } from "@/systemStatus";
import { useEffect, useState } from "react";

export function useSystemHeartbeat() {
  const [status, setStatus] = useState<SystemStatus>("checking");

  useEffect(() => subscribeSystemStatus(setStatus), []);

  useEffect(() => {
    void checkSystemHealth();
    const id = window.setInterval(() => void checkSystemHealth(), HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  return status;
}
