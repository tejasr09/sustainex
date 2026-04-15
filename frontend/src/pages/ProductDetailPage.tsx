import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ActionBadge } from "@/components/ActionBadge";
import { ConditionBadge } from "@/components/ConditionBadge";
import { api, conditionLabel } from "@/lib/api";
import { formatINR, usdToInr } from "@/lib/currency";
import type { MaterialInsight, ProductCondition, ProductPassport, RoutingDecision } from "@/types";

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductPassport | null>(null);
  const [insight, setInsight] = useState<MaterialInsight | null>(null);
  const [decision, setDecision] = useState<RoutingDecision | null>(null);
  const [override, setOverride] = useState<ProductCondition | "">("");
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async (pid: string) => {
    setLoading(true);
    setErr(null);
    try {
      const [p, m, d] = await Promise.all([
        api.getProduct(pid),
        api.materials(pid),
        api.decide(pid),
      ]);
      setProduct(p);
      setInsight(m);
      setDecision(d);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void load(id);
  }, [id]);

  const runSim = async () => {
    if (!id) return;
    setSimulating(true);
    setErr(null);
    try {
      const r = await api.simulateReturn(id);
      setProduct(r.passport);
      setInsight(r.materials);
      setDecision(r.routing);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSimulating(false);
    }
  };

  const rerunDecision = async () => {
    if (!id) return;
    try {
      const d = await api.decide(id, override || undefined);
      setDecision(d);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  if (!id) return null;

  if (loading && !product) {
    return <div className="glass-panel h-40 animate-pulse bg-ink-800/40" />;
  }

  if (err || !product || !insight || !decision) {
    return (
      <div className="space-y-4">
        <Link to="/products" className="text-sm text-loop-400 hover:text-loop-300">
          ← Back to passports
        </Link>
        <div className="glass-panel border-rose-500/30 p-6 text-rose-200">{err || "Not found"}</div>
      </div>
    );
  }

  const events = [...product.lifecycle_events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const photoFilenames = Array.from(
    new Set(
      events
        .map((ev) => ev.metadata?.photo_filename)
        .filter((name): name is string => typeof name === "string" && name.length > 0),
    ),
  );

  const conditions: ProductCondition[] = ["new", "good", "fair", "poor", "end_of_life"];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/products" className="text-sm text-loop-400 hover:text-loop-300">
            ← Passports
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">{product.name}</h1>
          <p className="mt-1 font-mono text-sm text-loop-400">{product.product_id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConditionBadge condition={product.condition} />
          <ActionBadge action={decision.recommended} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-white">Passport metadata</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-ink-500">SKU</dt>
              <dd className="font-medium text-white">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Origin</dt>
              <dd className="font-medium text-white">{product.origin_country}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Manufacturer</dt>
              <dd className="font-medium text-white">{product.manufacturer}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Category</dt>
              <dd className="font-medium text-white">{product.category}</dd>
            </div>
          </dl>
          {photoFilenames.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Product photos</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {photoFilenames.map((filename) => (
                  <a
                    key={filename}
                    href={`/api/uploads/${encodeURIComponent(filename)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group"
                  >
                    <img
                      src={`/api/uploads/${encodeURIComponent(filename)}`}
                      alt={`${product.name} uploaded`}
                      className="h-24 w-24 rounded-lg border border-white/10 object-cover transition group-hover:scale-105 group-hover:border-loop-300/50"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="glass-panel p-5">
          <h2 className="font-display text-lg font-semibold text-white">Routing snapshot</h2>
          <p className="mt-2 text-sm text-ink-400">
            Confidence {Math.round(decision.confidence * 100)}% · {decision.model_version}
          </p>
          <p className="mt-4 text-sm text-ink-300">
            Value retained ~{" "}
            <span className="font-semibold text-white">{formatINR(usdToInr(decision.estimated_value_retained_usd))}</span>
          </p>
          <p className="mt-1 text-sm text-ink-300">
            Carbon savings ~{" "}
            <span className="font-semibold text-white">{decision.estimated_carbon_saved_kg_co2e} kg CO₂e</span>
          </p>
          {decision.matched_facility ? (
            <p className="mt-4 text-xs text-ink-500">
              Matched facility:{" "}
              <span className="text-ink-200">
                {decision.matched_facility.name} ({decision.matched_facility.city})
              </span>
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wider text-ink-500">What-if condition</label>
            <select
              className="w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white"
              value={override}
              onChange={(e) => setOverride(e.target.value as ProductCondition | "")}
            >
              <option value="">Use passport condition</option>
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {conditionLabel(c)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void rerunDecision()}
              className="w-full rounded-lg border border-white/15 bg-white/5 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Recompute routing
            </button>
            <button
              type="button"
              disabled={simulating}
              onClick={() => void runSim()}
              className="w-full rounded-lg bg-gradient-to-r from-loop-500 to-teal-600 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {simulating ? "Simulating return…" : "Simulate return & route"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h2 className="font-display text-lg font-semibold text-white">Material composition</h2>
          <p className="mt-1 text-sm text-ink-500">
            Recyclable {insight.recyclable_mass_kg} kg · Reusable {insight.reusable_mass_kg} kg · Circularity contribution{" "}
            {insight.circularity_contribution}
          </p>
          <ul className="mt-4 divide-y divide-white/5">
            {insight.components.map((m) => (
              <li key={m.name} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{m.name}</p>
                  <p className="text-xs text-ink-500">{m.category}</p>
                </div>
                <div className="text-right text-xs text-ink-400">
                  <span>{m.mass_kg} kg</span>
                  <span className="mx-2 text-ink-600">·</span>
                  <span>{m.recyclable ? "Recyclable" : "Low recovery"}</span>
                  <span className="mx-2 text-ink-600">·</span>
                  <span>{m.embodied_carbon_kg_co2e} kg CO₂e</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-5">
          <h2 className="font-display text-lg font-semibold text-white">Lifecycle timeline</h2>
          <p className="mt-1 text-sm text-ink-500">Newest first</p>
          <ol className="mt-4 space-y-4">
            {events.map((ev, idx) => (
              <li key={`${ev.timestamp}-${idx}`} className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-loop-400 ring-4 ring-loop-500/20" />
                <p className="text-sm font-medium capitalize text-white">{ev.event_type.replace(/_/g, " ")}</p>
                <p className="text-xs text-ink-500">
                  {new Date(ev.timestamp).toLocaleString()} · {ev.actor}
                </p>
                {ev.note ? <p className="mt-1 text-sm text-ink-400">{ev.note}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h2 className="font-display text-lg font-semibold text-white">Score breakdown</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {decision.action_scores
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((s) => (
              <div key={s.action} className="rounded-xl border border-white/10 bg-ink-950/50 p-4">
                <div className="flex items-center justify-between">
                  <ActionBadge action={s.action} />
                  <span className="font-mono text-sm text-loop-300">{s.score.toFixed(3)}</span>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-ink-500">
                  {s.rationale.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
