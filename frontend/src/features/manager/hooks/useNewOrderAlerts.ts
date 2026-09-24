import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getManagerOrders } from "@/api";
import { useAuth } from "@/hooks/useAuth";

const ALERTS_QUERY_KEY = ["orders", "manager", "alerts", "new"] as const;

function playNewOrderSound() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const beep = (start: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    };

    beep(now, 880);
    beep(now + 0.28, 1175);
    void ctx.resume();
    window.setTimeout(() => void ctx.close(), 800);
  } catch {
    // браузер без AudioContext / автоплей — молча
  }
}

/** Пульс новых заказов: бейдж + звук при появлении status=new */
export function useNewOrderAlerts(enabled: boolean) {
  const { isManager } = useAuth();
  const active = enabled && isManager;

  const { data } = useQuery({
    queryKey: ALERTS_QUERY_KEY,
    queryFn: () =>
      getManagerOrders({ status: "new", bucket: "active", limit: 50 }),
    enabled: active,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    staleTime: 5_000,
  });

  const items = data?.items ?? [];
  const badge = items.length;
  const knownIds = useRef<Set<string> | null>(null);
  const primed = useRef(false);

  useEffect(() => {
    if (!active) return;
    const ids = items.map((o) => o.id);

    if (!primed.current) {
      knownIds.current = new Set(ids);
      primed.current = true;
      return;
    }

    const prev = knownIds.current ?? new Set<string>();
    const arrived = ids.filter((id) => !prev.has(id));
    if (arrived.length > 0) {
      playNewOrderSound();
    }
    knownIds.current = new Set(ids);
  }, [active, items]);

  useEffect(() => {
    if (!active) return;
    const base = "Панель · 2Brothers";
    document.title = badge > 0 ? `(${badge}) Новые заказы` : base;
    return () => {
      document.title = base;
    };
  }, [active, badge]);

  return { badge, newOrderIds: items.map((o) => o.id) };
}
