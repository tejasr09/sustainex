import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActionBadge } from "@/components/ActionBadge";
import { ConditionBadge } from "@/components/ConditionBadge";
import { MetricCard } from "@/components/MetricCard";
import { formatINR, usdToInr } from "@/lib/currency";
import { useSectionTransitions } from "@/hooks/useSectionTransitions";
import { api } from "@/lib/api";
import type { DashboardMetrics, ProductCondition, ProductPassport, RoutingDecision } from "@/types";

type InputProductModel = {
  name: string;
  category: string;
  condition: ProductCondition;
  baseValueInr: number;
  distanceKm: number;
  userCity: string;
};

type InputComputed = {
  estimatedCarbonKg: number;
  recommended: RoutingDecision["recommended"];
  confidence: number;
};

export function HomePage() {
  useSectionTransitions("home");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [products, setProducts] = useState<ProductPassport[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [decision, setDecision] = useState<RoutingDecision | null>(null);
  const [liveRoutingMixData, setLiveRoutingMixData] = useState<Array<{ action: string; count: number }>>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [inputProduct, setInputProduct] = useState<InputProductModel>({
    name: "Custom Device",
    category: "Electronics",
    condition: "good",
    baseValueInr: 24000,
    distanceKm: 45,
    userCity: "Bengaluru",
  });
  const cityCoords: Record<string, { lat: number; lon: number }> = {
    Bengaluru: { lat: 12.9716, lon: 77.5946 },
    Mumbai: { lat: 19.076, lon: 72.8777 },
    Delhi: { lat: 28.6139, lon: 77.209 },
    Hyderabad: { lat: 17.385, lon: 78.4867 },
    Chennai: { lat: 13.0827, lon: 80.2707 },
    Pune: { lat: 18.5204, lon: 73.8567 },
    Kolkata: { lat: 22.5726, lon: 88.3639 },
    Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  };

  useEffect(() => {
    let alive = true;

    api
      .dashboard()
      .then((d) => {
        if (!alive) return;
        setMetrics(d);
      })
      .catch(() => {
        if (!alive) return;
        setWarnings((prev) => [...prev, "Sustainability metrics are in demo mode."]);
      });

    api
      .listProducts()
      .then((list) => {
        if (!alive) return;
        setProducts(list);
        if (list[0]) setSelected(list[0].product_id);
      })
      .catch(() => {
        if (!alive) return;
        setWarnings((prev) => [...prev, "Product passport data is in demo mode."]);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  useEffect(() => {
    if (!selected) return;
    let alive = true;

    api
      .decide(selected)
      .then((d) => {
        if (!alive) return;
        setDecision(d);
      })
      .catch(() => {
        if (!alive) return;
        setWarnings((prev) => [...prev, "Routing decision is in demo mode."]);
      });

    return () => {
      alive = false;
    };
  }, [selected]);

  useEffect(() => {
    if (products.length === 0) {
      setLiveRoutingMixData([]);
      return;
    }
    let alive = true;
    Promise.all(
      products.map((p) =>
        api
          .decide(p.product_id)
          .then((d) => d.recommended)
          .catch(() => null),
      ),
    ).then((actions) => {
      if (!alive) return;
      const counts = actions.reduce<Record<string, number>>((acc, action) => {
        if (!action) return acc;
        acc[action] = (acc[action] ?? 0) + 1;
        return acc;
      }, {});
      const chartData = Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(([action, count]) => ({
          action: action.charAt(0).toUpperCase() + action.slice(1),
          count,
        }));
      setLiveRoutingMixData(chartData);
    });
    return () => {
      alive = false;
    };
  }, [products]);

  const metricsData: DashboardMetrics = metrics ?? {
    reuse_rate_pct: 64.2,
    recycling_efficiency_pct: 81.4,
    carbon_savings_tons_co2e: 142.6,
    value_retained_million_usd: 3.8,
    circularity_score: 78.9,
    products_tracked: 1240,
    returns_routed_30d: 286,
    top_actions: { reuse: 48, refurbish: 30, recycle: 7 },
    trend_labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    trend_circularity: [62, 65, 68, 72, 75, 79],
    trend_carbon_tons: [14, 17, 19, 23, 31, 39],
  };

  const productsData: ProductPassport[] = useMemo(
    () =>
      products.length > 0
        ? products
        : [
            {
              product_id: "LC-EAR-1001",
              sku: "EAR-1001",
              name: "PulseBud Pro",
              category: "Audio",
              origin_country: "India",
              manufacturer: "Sustainex Devices",
              condition: "good",
              materials: [],
              lifecycle_events: [],
            },
            {
              product_id: "LC-PHN-2042",
              sku: "PHN-2042",
              name: "NovaPhone Mini",
              category: "Mobile",
              origin_country: "Vietnam",
              manufacturer: "Sustainex Devices",
              condition: "fair",
              materials: [],
              lifecycle_events: [],
            },
            {
              product_id: "LC-WCH-0902",
              sku: "WCH-0902",
              name: "Orbit Watch S",
              category: "Wearables",
              origin_country: "India",
              manufacturer: "Sustainex Devices",
              condition: "good",
              materials: [],
              lifecycle_events: [],
            },
          ],
    [products],
  );

  const selectedProduct = productsData.find((p) => p.product_id === selected) ?? productsData[0];
  const decisionData: RoutingDecision =
    decision ?? {
      product_id: selectedProduct?.product_id ?? "LC-DEMO",
      recommended: "reuse",
      confidence: 0.84,
      action_scores: [
        { action: "reuse", score: 0.87, rationale: ["High condition fit", "Strong nearby facility match"] },
        { action: "refurbish", score: 0.72, rationale: ["Moderate cost recovery"] },
        { action: "recycle", score: 0.28, rationale: ["Best reserved for end-of-life condition"] },
      ],
      estimated_value_retained_usd: 182,
      estimated_carbon_saved_kg_co2e: 37,
      matched_facility: null,
      model_version: "demo-v1",
    };

  const warningText = Array.from(new Set(warnings)).join(" ");
  const trendData = metricsData.trend_labels.map((label, i) => ({
    label,
    circularity: metricsData.trend_circularity[i] ?? 0,
    carbon: metricsData.trend_carbon_tons[i] ?? 0,
  }));
  const metricsRoutingMixData = Object.entries(metricsData.top_actions)
    .filter(([, count]) => Number(count) > 0)
    .map(([action, count]) => ({
      action: action.charAt(0).toUpperCase() + action.slice(1),
      count,
    }));
  const routingMixData = (liveRoutingMixData.length > 0 ? liveRoutingMixData : metricsRoutingMixData).filter(
    (row) => row.action !== "Remanufacture",
  );
  const computeInputProduct = (model: InputProductModel): InputComputed => {
    const conditionFactor: Record<ProductCondition, number> = {
      new: 0.95,
      good: 0.84,
      fair: 0.66,
      poor: 0.4,
      end_of_life: 0.22,
    };
    const cond = conditionFactor[model.condition];
    const distancePenalty = Math.min(0.18, (Math.max(0, model.distanceKm) / 500) * 0.18);

    const estimatedCarbonKg = Math.round((model.baseValueInr / 1200) * (0.95 * cond + 0.4) * (1 - distancePenalty));

    let recommended: RoutingDecision["recommended"] = "reuse";
    if (model.condition === "end_of_life" || cond < 0.3) recommended = "recycle";
    else if (cond < 0.75) recommended = "refurbish";

    const confidence = Number(Math.min(0.96, Math.max(0.52, 0.58 + cond * 0.28)).toFixed(2));
    return { estimatedCarbonKg, recommended, confidence };
  };
  const inputComputed = computeInputProduct(inputProduct);
  const makeIdToken = (value: string) =>
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "CUSTOM";
  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert("Please accept Terms and Conditions");
      return;
    }
    if (!photoFile) {
      alert("Please upload a product photo before submitting.");
      return;
    }
    if (
      !inputProduct.name.trim() ||
      !inputProduct.category.trim() ||
      !Number.isFinite(inputProduct.baseValueInr) ||
      inputProduct.baseValueInr <= 0 ||
      !Number.isFinite(inputProduct.distanceKm) ||
      inputProduct.distanceKm < 0
    ) {
      alert("Inputs don't make sense. Please enter valid product details.");
      return;
    }
    const idSuffix = Date.now().toString().slice(-6);
    const token = makeIdToken(inputProduct.name);
    const loc = cityCoords[inputProduct.userCity] ?? cityCoords.Bengaluru;
    const productId = `DPP-${token}-${idSuffix}`;
    const payload = new FormData();
    payload.append("product_id", productId);
    payload.append("sku", `${token.slice(0, 12)}-${idSuffix}`);
    payload.append("name", inputProduct.name.trim() || "Custom Device");
    payload.append("category", inputProduct.category.trim() || "Electronics");
    payload.append("origin_country", "IN");
    payload.append("manufacturer", "Sustainex User Entry");
    payload.append("condition", inputProduct.condition);
    payload.append("base_value_inr", String(inputProduct.baseValueInr));
    payload.append("current_location_lat", String(loc.lat));
    payload.append("current_location_lon", String(loc.lon));
    if (photoFile) payload.append("photo", photoFile);
    setSubmittingProduct(true);
    try {
      const created = await api.uploadProduct(payload);
      setProducts((prev) => [created, ...prev.filter((p) => p.product_id !== created.product_id)]);
      setSelected(created.product_id);
      try {
        const latestMetrics = await api.dashboard();
        setMetrics(latestMetrics);
      } catch {
        // Keep previous metrics if refresh fails.
      }
      setAcceptedTerms(false);
      setPhotoFile(null);
      alert("Product and photo uploaded. Added to Routing Engine dropdown.");
    } catch {
      alert("Could not save product. Please check API/backend.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  return (
    <div className="space-y-16">
      <section className="section-transition grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center" data-section-transition>
        <div data-reveal>
          <p className="text-sm font-medium uppercase tracking-widest text-loop-400">Circular economy intelligence</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Turn returns into <span className="text-gradient">recovered value</span>, not waste.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-300">
            Sustainex connects product identity, materials science signals, and operations-aware routing so every end-of-life unit
            finds the highest-value, lowest-impact path.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="btn-primary"
            >
              Explore passports
            </Link>
            <Link
              to="/router"
              className="btn-secondary"
            >
              Run routing demo
            </Link>
            <Link
              to="/dashboard"
              className="btn-ghost"
            >
              View impact metrics →
            </Link>
          </div>
        </div>

        <div className="glass-panel p-6 lg:p-8" data-reveal data-reveal-delay="120">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">End-to-end flow</p>
          <ol className="mt-4 space-y-4">
            {[
              "Mint or ingest a Digital Product Passport with materials BOM.",
              "Capture lifecycle events — use, repair, return — with timestamps.",
              "On return, the routing engine scores reuse → refurbish → recycle.",
              "Match to the nearest facility that can execute the winning pathway.",
              "Roll up sustainability KPIs for leadership and regulators.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-loop-500/20 text-sm font-bold text-loop-300">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-ink-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {warningText ? (
        <div className="glass-panel border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200" data-reveal>
          {warningText}
        </div>
      ) : null}

      <section id="sustainability" data-reveal data-section-transition className="section-transition scroll-mt-28">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">Sustainability</h2>
          <p className="mt-2 max-w-2xl text-ink-400">
            Portfolio-level circularity KPIs powered by passport coverage and routing outcomes.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal data-reveal-delay="80">
          <MetricCard
            label="Circularity score"
            value={`${metricsData.circularity_score}`}
            hint="0-100 composite index"
            accent="emerald"
          />
          <MetricCard
            label="Reuse rate"
            value={`${metricsData.reuse_rate_pct}%`}
            hint="Reuse + partial refurbish credit"
            accent="teal"
          />
          <MetricCard
            label="Recycling efficiency"
            value={`${metricsData.recycling_efficiency_pct}%`}
            hint="Recycle pathway efficiency"
            accent="violet"
          />
          <MetricCard
            label="Carbon savings"
            value={`${metricsData.carbon_savings_tons_co2e} t`}
            hint="CO2e avoided vs linear disposal"
            accent="amber"
          />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="glass-panel p-5" data-reveal data-reveal-delay="140">
            <h3 className="font-display text-lg font-semibold text-white">Circularity trend</h3>
            <p className="mt-1 text-sm text-ink-500">Month-over-month trajectory</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="circularity" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-panel p-5" data-reveal data-reveal-delay="200">
            <h3 className="font-display text-lg font-semibold text-white">Routing action mix</h3>
            <p className="mt-1 text-sm text-ink-500">Distribution from recent decisions</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routingMixData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="action" stroke="#94a3b8" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#2dd4bf" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section id="passports" data-reveal data-section-transition className="section-transition scroll-mt-28">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Product Passport</h2>
            <p className="mt-2 max-w-2xl text-ink-400">
              Live passport records with condition and traceability snapshots.
            </p>
          </div>
          <Link to="/products" className="text-sm font-medium text-loop-400 hover:text-loop-300">
            Open full passports →
          </Link>
        </div>
        <div className="mt-6 grid gap-4">
          {productsData.slice(0, 4).map((p, i) => (
            <div key={p.product_id} className="glass-panel p-5" data-reveal data-reveal-delay={String(60 + i * 60)}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-lg font-semibold text-white">{p.name}</p>
                  <p className="mt-1 font-mono text-xs text-loop-400">{p.product_id}</p>
                  <p className="mt-2 text-sm text-ink-400">
                    {p.manufacturer} · {p.category}
                  </p>
                </div>
                <ConditionBadge condition={(p.condition as ProductCondition) ?? "good"} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="routing" data-reveal className="scroll-mt-28">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Routing Engine</h2>
            <p className="mt-2 max-w-2xl text-ink-400">
              Weighted action ranking for reuse, refurbish, and recycle.
            </p>
          </div>
          <select
            className="rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white"
            value={selected || selectedProduct?.product_id || ""}
            onChange={(e) => setSelected(e.target.value)}
          >
            {productsData.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="glass-panel p-5 lg:col-span-2" data-reveal data-reveal-delay="80">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-ink-400">Recommended</span>
              <ActionBadge action={decisionData.recommended} />
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-ink-400">
                confidence {(decisionData.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {decisionData.action_scores
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((s) => (
                  <div
                    key={s.action}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-950/50 px-3 py-2"
                  >
                    <ActionBadge action={s.action} />
                    <span className="font-mono text-sm text-loop-300">{s.score.toFixed(3)}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="glass-panel p-5" data-reveal data-reveal-delay="140">
            <p className="text-xs uppercase tracking-wider text-ink-500">Impact snapshot</p>
            <p className="mt-4 text-sm text-ink-300">Retained value (model-derived)</p>
            <p className="font-display text-3xl font-bold text-white">
              {formatINR(usdToInr(decisionData.estimated_value_retained_usd))}
            </p>
            <p className="mt-4 text-sm text-ink-300">Carbon saved</p>
            <p className="font-display text-3xl font-bold text-white">{decisionData.estimated_carbon_saved_kg_co2e} kg</p>
            <p className="mt-4 text-sm text-ink-300">Nearest facility</p>
            <p className="text-sm font-semibold text-white">
              {decisionData.matched_facility
                ? `${decisionData.matched_facility.name} · ${decisionData.matched_facility.city}, ${decisionData.matched_facility.country}`
                : "No nearby facility found"}
            </p>
          </div>
        </div>
        <div className="mt-4 glass-panel p-5" data-reveal data-reveal-delay="190">
          <h3 className="font-display text-lg font-semibold text-white">Action score chart</h3>
          <p className="mt-1 text-sm text-ink-500">Normalized confidence by route option</p>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={decisionData.action_scores.map((item) => ({
                  action: item.action.charAt(0).toUpperCase() + item.action.slice(1),
                  score: Number((item.score * 100).toFixed(1)),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="action" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Score"]}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="score" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 glass-panel p-5" data-reveal data-reveal-delay="240">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Input your product</h3>
              <p className="mt-1 text-sm text-ink-500">Enter product details and get instant circular routing estimates.</p>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-ink-400">No API required</span>
          </div>
          <form onSubmit={handleInputSubmit}>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-ink-300">
                Product name
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white"
                  value={inputProduct.name}
                  onChange={(e) => setInputProduct((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label className="text-sm text-ink-300">
                Category
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white"
                  value={inputProduct.category}
                  onChange={(e) => setInputProduct((p) => ({ ...p, category: e.target.value }))}
                />
              </label>
              <label className="text-sm text-ink-300">
                Condition
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white"
                  value={inputProduct.condition}
                  onChange={(e) => setInputProduct((p) => ({ ...p, condition: e.target.value as ProductCondition }))}
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="end_of_life">End of life</option>
                </select>
              </label>
              <label className="text-sm text-ink-300">
                Base value (INR)
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white"
                  value={inputProduct.baseValueInr}
                  onChange={(e) => setInputProduct((p) => ({ ...p, baseValueInr: Number(e.target.value || 0) }))}
                />
              </label>
              <label className="text-sm text-ink-300">
                Return distance (km)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white"
                  value={inputProduct.distanceKm}
                  onChange={(e) => setInputProduct((p) => ({ ...p, distanceKm: Number(e.target.value || 0) }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                />
              </label>
              <label className="text-sm text-ink-300">
                Your city (nearest facility lookup)
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white"
                  value={inputProduct.userCity}
                  onChange={(e) => setInputProduct((p) => ({ ...p, userCity: e.target.value }))}
                >
                  {Object.keys(cityCoords).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-ink-300 md:col-span-3">
                Product photo
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-loop-500/20 file:px-3 file:py-1 file:text-loop-100"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {photoPreview ? (
              <div className="mt-3">
                <p className="mb-2 text-xs text-ink-500">Preview</p>
                <img src={photoPreview} alt="Product preview" className="h-24 w-24 rounded-lg border border-white/10 object-cover" />
              </div>
            ) : null}
            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm text-ink-300">
                I agree to the Terms and Conditions
              </label>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-ink-950/60 p-3">
                <p className="text-xs text-ink-500">Estimated carbon savings</p>
                <p className="mt-1 font-display text-2xl font-semibold text-white">{inputComputed.estimatedCarbonKg} kg</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-ink-950/60 p-3">
                <p className="text-xs text-ink-500">Recommended action</p>
                <div className="mt-2 flex items-center gap-2">
                  <ActionBadge action={inputComputed.recommended} />
                  <span className="text-sm text-ink-300">confidence {(inputComputed.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={!acceptedTerms || !photoFile || submittingProduct}
              className="mt-4 rounded-lg bg-gradient-to-r from-loop-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingProduct ? "Saving..." : "Submit"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
