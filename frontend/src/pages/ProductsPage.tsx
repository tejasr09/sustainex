import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ActionBadge } from "@/components/ActionBadge";
import { ConditionBadge } from "@/components/ConditionBadge";
import { api } from "@/lib/api";
import type { ProductPassport, RoutingDecision } from "@/types";

export function ProductsPage() {
  const [products, setProducts] = useState<ProductPassport[]>([]);
  const [routes, setRoutes] = useState<Record<string, RoutingDecision>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .listProducts()
      .then(async (list) => {
        if (!alive) return;
        setProducts(list);
        const entries = await Promise.all(
          list.map(async (p) => {
            try {
              const d = await api.decide(p.product_id);
              return [p.product_id, d] as const;
            } catch {
              return null;
            }
          }),
        );
        if (!alive) return;
        const map: Record<string, RoutingDecision> = {};
        for (const e of entries) {
          if (e) map[e[0]] = e[1];
        }
        setRoutes(map);
      })
      .catch((e: Error) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, []);

  if (err) {
    return (
      <div className="glass-panel border-rose-500/30 p-6 text-rose-200">
        Failed to load products: {err}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div data-reveal>
        <h1 className="font-display text-3xl font-bold text-white">Digital product passports</h1>
        <p className="mt-2 max-w-2xl text-ink-400">
          Each row is a living passport: materials BOM, condition, and immutable-style lifecycle events. Open a record for full
          traceability.
        </p>
      </div>

      <div className="grid gap-4">
        {products.length === 0
          ? [1, 2, 3].map((i) => <div key={i} className="glass-panel h-24 animate-pulse bg-ink-800/40" />)
          : products.map((p, i) => (
              <Link
                key={p.product_id}
                to={`/products/${encodeURIComponent(p.product_id)}`}
                className="glass-panel group block p-5 transition-all hover:border-loop-500/30 hover:shadow-lg"
                data-reveal
                data-reveal-delay={String(40 + i * 50)}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-white group-hover:text-loop-200">{p.name}</h2>
                      <ConditionBadge condition={p.condition} />
                    </div>
                    <p className="mt-1 font-mono text-xs text-loop-400">{p.product_id}</p>
                    <p className="mt-2 text-sm text-ink-400">
                      {p.manufacturer} · {p.category}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className="text-xs uppercase tracking-wider text-ink-500">Engine recommendation</span>
                    {routes[p.product_id] ? (
                      <ActionBadge action={routes[p.product_id].recommended} />
                    ) : (
                      <span className="text-xs text-ink-500">Computing…</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
