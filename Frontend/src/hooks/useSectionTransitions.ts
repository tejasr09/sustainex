import { useEffect } from "react";

export function useSectionTransitions(reloadKey?: string) {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section-transition]"));
    if (sections.length === 0) return;

    let raf = 0;

    const update = () => {
      const vh = window.innerHeight || 1;
      const center = vh * 0.5;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height * 0.5;
        const distance = sectionCenter - center;
        const normalized = Math.max(-1, Math.min(1, distance / (vh * 0.9)));
        const abs = Math.abs(normalized);
        const y = normalized * -18;
        const scale = 1 - abs * 0.02;
        const opacity = 1 - abs * 0.2;

        section.style.setProperty("--st-y", `${y.toFixed(2)}px`);
        section.style.setProperty("--st-s", scale.toFixed(4));
        section.style.setProperty("--st-o", Math.max(0.8, opacity).toFixed(4));
      }
    };

    const queueUpdate = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
    };
  }, [reloadKey]);
}
