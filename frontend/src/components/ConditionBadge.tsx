import type { ProductCondition } from "@/types";

const styles: Record<ProductCondition, string> = {
  new: "bg-loop-500/20 text-loop-300 border-loop-500/30",
  good: "bg-teal-500/20 text-teal-200 border-teal-500/30",
  fair: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  poor: "bg-orange-500/15 text-orange-200 border-orange-500/25",
  end_of_life: "bg-rose-500/15 text-rose-200 border-rose-500/25",
};

export function ConditionBadge({ condition }: { condition: ProductCondition }) {
  const label = condition.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[condition]}`}
    >
      {label}
    </span>
  );
}
