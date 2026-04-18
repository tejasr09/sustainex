import { motion } from "framer-motion";

export const ORDER_STEPS = ["Collection", "In Transit", "Facility Processing", "Completed"] as const;
export type OrderStep = (typeof ORDER_STEPS)[number];

export function OrderProgressStepper({ status }: { status: OrderStep }) {
  const activeIndex = Math.max(0, ORDER_STEPS.indexOf(status));
  const progressPct = (activeIndex / (ORDER_STEPS.length - 1)) * 100;

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-white">Order progress</h3>
        <span className="rounded-full border border-loop-300/35 bg-loop-500/10 px-3 py-1 text-xs text-loop-200">{status}</span>
      </div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-[11px] h-[3px] rounded-full bg-white/10" />
        <motion.div
          className="absolute left-0 top-[11px] h-[3px] rounded-full bg-gradient-to-r from-loop-400 to-fuchsia-400"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative grid grid-cols-4 gap-2">
          {ORDER_STEPS.map((step, index) => {
            const isDone = index <= activeIndex;
            return (
              <div key={step} className="flex flex-col items-center text-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isDone ? 1 : 0.9,
                    backgroundColor: isDone ? "rgba(139, 114, 255, 1)" : "rgba(255,255,255,0.2)",
                    boxShadow: isDone ? "0 0 0 6px rgba(139,114,255,0.18)" : "0 0 0 0 rgba(0,0,0,0)",
                  }}
                  transition={{ duration: 0.35 }}
                  className="z-10 h-6 w-6 rounded-full border border-white/30"
                />
                <span className={`mt-3 text-xs ${isDone ? "text-white" : "text-ink-400"}`}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
