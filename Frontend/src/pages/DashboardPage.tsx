import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/MetricCard";
import { api } from "@/lib/api";
import { formatINRCompact, usdToInr } from "@/lib/currency";
import type { DashboardMetrics } from "@/types";

export function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .dashboard()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: Error) => {
        if (alive) setErr(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (err) {
    return (
      <div className="glass-panel border-rose-500/30 p-6 text-rose-200">
        <p className="font-semibold">Could not load dashboard</p>
        <p className="mt-2 text-sm text-rose-300/80">{err}</p>
        <p className="mt-4 text-sm text-ink-400">Start the API on port 8000 and refresh.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel h-28 animate-pulse bg-ink-800/50" />
        ))}
      </div>
    );
  }

  const trendData = data.trend_labels.map((label, i) => ({
    label,
    circularity: data.trend_circularity[i],
    carbon: data.trend_carbon_tons[i],
  }));

  const actionsData = Object.entries(data.top_actions).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value,
  }));

  return (
    <div className="space-y-8">
      <div data-reveal>
        <h1 className="font-display text-3xl font-bold text-white">Sustainability dashboard</h1>
        <p className="mt-2 max-w-2xl text-ink-400">
          Portfolio-level circularity synthesized from passport coverage, simulated returns, and the routing engine distribution.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal data-reveal-delay="80">
        <MetricCard
          label="Circularity score"
          value={`${data.circularity_score}`}
          hint="0–100 composite index"
          accent="emerald"
        />
        <MetricCard
          label="Reuse rate"
          value={`${data.reuse_rate_pct}%`}
          hint="Reuse + partial credit for refurbish pathways"
          accent="teal"
        />
        <MetricCard
          label="Recycling efficiency"
          value={`${data.recycling_efficiency_pct}%`}
          hint="Recycle pathway efficiency"
          accent="violet"
        />
        <MetricCard
          label="Carbon savings"
          value={`${data.carbon_savings_tons_co2e} t`}
          hint="CO₂e avoided vs linear disposal (modeled)"
          accent="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel p-5 lg:col-span-2" data-reveal data-reveal-delay="120">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Circularity trajectory</h2>
            <span className="text-xs text-ink-500">Simulated trend</span>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="cFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Area type="monotone" dataKey="circularity" stroke="#10b981" fill="url(#cFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5" data-reveal data-reveal-delay="180">
          <h2 className="font-display text-lg font-semibold text-white">Value retained</h2>
          <p className="mt-1 text-sm text-ink-500">Economic recovery potential (demo model)</p>
          <p className="mt-6 font-display text-4xl font-bold text-gradient">
            {formatINRCompact(usdToInr(data.value_retained_million_usd * 1_000_000))}
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <dt className="text-ink-500">Products tracked</dt>
              <dd className="font-medium text-white">{data.products_tracked}</dd>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <dt className="text-ink-500">Returns routed (30d)</dt>
              <dd className="font-medium text-white">{data.returns_routed_30d}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5" data-reveal data-reveal-delay="120">
          <h2 className="font-display text-lg font-semibold text-white">Carbon trend (tons)</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="carbon" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5" data-reveal data-reveal-delay="180">
          <h2 className="font-display text-lg font-semibold text-white">Routing mix</h2>
          <p className="mt-1 text-sm text-ink-500">From engine recommendations on seed catalog</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={110} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="count" fill="#a78bfa" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
