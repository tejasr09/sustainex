export function MetricCard({
  label,
  value,
  hint,
  accent = "emerald",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "teal" | "amber" | "violet";
}) {
  const ring =
    accent === "emerald"
      ? "from-loop-500/20 to-transparent"
      : accent === "teal"
        ? "from-teal-500/20 to-transparent"
        : accent === "amber"
          ? "from-amber-500/20 to-transparent"
          : "from-violet-500/20 to-transparent";

  return (
    <div className={`glass-panel relative overflow-hidden p-5`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ring} opacity-80`} />
      <p className="relative text-sm font-medium text-ink-400">{label}</p>
      <p className="relative mt-2 font-display text-3xl font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className="relative mt-2 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}
