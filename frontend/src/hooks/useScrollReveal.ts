import { useEffect } from "react";

export function useScrollReveal(reloadKey?: string) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const node = entry.target as HTMLElement;
          if (entry.isIntersecting) node.classList.add("reveal-in");
          else node.classList.remove("reveal-in");
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" },
    );

    const registerNode = (node: HTMLElement) => {
      const delay = node.dataset.revealDelay;
      if (delay) {
        node.style.setProperty("--reveal-delay", `${delay}ms`);
      }
      observer.observe(node);
    };

    const registerAll = () => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      for (const node of nodes) registerNode(node);
    };

    registerAll();

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;
        mutation.addedNodes.forEach((added) => {
          if (!(added instanceof HTMLElement)) return;
          if (added.matches("[data-reveal]")) registerNode(added);
          const nested = added.querySelectorAll<HTMLElement>("[data-reveal]");
          nested.forEach((node) => registerNode(node));
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [reloadKey]);
}
