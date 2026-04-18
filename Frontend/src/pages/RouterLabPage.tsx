import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ActionBadge } from "@/components/ActionBadge";
import { ORDER_STEPS, OrderProgressStepper, type OrderStep } from "@/components/OrderProgressStepper";
import { api } from "@/lib/api";
import { formatINR, usdToInr } from "@/lib/currency";
import type { ProductPassport, RoutingDecision } from "@/types";

export function RouterLabPage() {
  const [products, setProducts] = useState<ProductPassport[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [decision, setDecision] = useState<RoutingDecision | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStep>("Collection");

  useEffect(() => {
    api
      .listProducts()
      .then((list) => {
        setProducts(list);
        if (list[0]) setSelected(list[0].product_id);
        setStatus("In Transit");
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    setStatus("Facility Processing");
    api
      .decide(selected)
      .then((d) => {
        if (!alive) return;
        setDecision(d);
        setStatus("Completed");
      })
      .catch((e: Error) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [selected]);

  if (err && products.length === 0) {
    return (
      <div className="glass-panel border-rose-500/30 p-6 text-rose-200">
        API unavailable: {err}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div data-reveal>
        <h1 className="font-display text-3xl font-bold text-white">Routing engine lab</h1>
        <p className="mt-2 max-w-2xl text-ink-400">
          Transparent, weighted scoring across condition fit, material value, recovery economics, carbon pathway, and geospatial
          facility proximity. Swap this core for an ONNX / sklearn model using the same API contract.
        </p>
      </div>
      <div data-reveal data-reveal-delay="40">
        <OrderProgressStepper status={status || ORDER_STEPS[0]} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="glass-panel p-5" data-reveal data-reveal-delay="80">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">Product</label>
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2.5 text-sm text-white"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-4 text-xs text-ink-500">
            Weights: condition 28% · materials 22% · cost 18% · carbon 17% · facility 15%
          </p>
          {selected ? (
            <Link
              to={`/products/${encodeURIComponent(selected)}`}
              className="mt-6 inline-block text-sm font-medium text-loop-400 hover:text-loop-300"
            >
              Open full passport →
            </Link>
          ) : null}
        </div>

        {!decision ? (
          <div className="glass-panel flex h-64 items-center justify-center text-ink-500" data-reveal data-reveal-delay="140">
            Loading decision…
          </div>
        ) : (
          <div className="glass-panel p-6" data-reveal data-reveal-delay="140">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-ink-400">Recommended</span>
              <ActionBadge action={decision.recommended} />
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-ink-400">
                confidence {(decision.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4">
                <p className="text-xs text-ink-500">Value retained</p>
                <p className="mt-1 font-display text-2xl font-semibold text-white">
                  {formatINR(usdToInr(decision.estimated_value_retained_usd))}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4">
                <p className="text-xs text-ink-500">Carbon savings</p>
                <p className="mt-1 font-display text-2xl font-semibold text-white">
                  {decision.estimated_carbon_saved_kg_co2e} kg
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink-950/60 p-4">
                <p className="text-xs text-ink-500">Facility match</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {decision.matched_facility
                    ? `${decision.matched_facility.name} · ${decision.matched_facility.city}`
                    : "No geo on passport"}
                </p>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-sm font-medium text-ink-300">All actions ranked</p>
              <div className="mt-3 space-y-2">
                {decision.action_scores.map((s) => (
                  <div
                    key={s.action}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <ActionBadge action={s.action} />
                    <span className="font-mono text-sm text-loop-300">{s.score.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
