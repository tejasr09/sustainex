import type { RoutingAction } from "@/types";
import { actionLabel } from "@/lib/api";

const styles: Record<RoutingAction, string> = {
  reuse: "bg-loop-600/30 text-loop-200 border-loop-400/40",
  refurbish: "bg-sky-500/20 text-sky-200 border-sky-400/30",
  recycle: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
};

export function ActionBadge({ action }: { action: RoutingAction }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles[action]}`}
    >
      {actionLabel(action)}
    </span>
  );
}
