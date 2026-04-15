import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, authSession } from "@/lib/api";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const navBase = [
  { to: "/", label: "Overview" },
  { to: "/#sustainability", label: "Sustainability" },
  { to: "/#passports", label: "Product passports" },
  { to: "/#routing", label: "Routing engine" },
];

export function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [authName, setAuthName] = useState<string>(authSession.getUserName());
  useScrollReveal(loc.pathname);
  const nav = useMemo(() => [...navBase, { to: "/auth", label: authName ? "Account" : "Login" }], [authName]);

  const activeNav = useMemo(() => {
    if (loc.pathname !== "/") return loc.pathname;
    return activeSection || (loc.hash || "/");
  }, [activeSection, loc.hash, loc.pathname]);

  const navigateWithTransition = (to: string) => {
    const go = () => {
      if (to === "/") {
        if (loc.pathname !== "/") {
          navigate("/");
          return;
        }
        window.history.replaceState(null, "", "/");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (to.startsWith("/#")) {
        const id = to.slice(2);
        const scrollToTarget = () => {
          const target = document.getElementById(id);
          if (!target) return;
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", `/#${id}`);
        };
        if (loc.pathname !== "/") {
          navigate("/");
          requestAnimationFrame(() => requestAnimationFrame(scrollToTarget));
          return;
        }
        scrollToTarget();
        return;
      }
      navigate(to);
    };
    const doc = document as Document & {
      startViewTransition?: (update: () => void) => void;
    };
    if (doc.startViewTransition) {
      doc.startViewTransition(go);
      return;
    }
    go();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!loc.hash) return;
    const id = loc.hash.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loc.hash]);

  useEffect(() => {
    if (loc.pathname !== "/") {
      setActiveSection("");
      return;
    }
    const sections = ["sustainability", "passports", "routing"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const topHit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!topHit) return;
        setActiveSection(`#${topHit.target.id}`);
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-30% 0px -50% 0px" },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loc.pathname]);

  useEffect(() => {
    const sid = authSession.getSessionId();
    if (!sid) {
      setAuthName("");
      return;
    }
    api
      .me(sid)
      .then((res) => {
        setAuthName(res.name);
      })
      .catch(() => {
        authSession.clear();
        setAuthName("");
      });
  }, [loc.pathname]);

  const handleLogout = async () => {
    const sid = authSession.getSessionId();
    if (sid) {
      try {
        await api.logout(sid);
      } catch {
        // clear local session regardless of backend status
      }
    }
    authSession.clear();
    setAuthName("");
    navigateWithTransition("/auth");
  };

  return (
    <div className="app-shell min-h-screen flex flex-col bg-grid-pattern bg-grid bg-[length:48px_48px]">
      <div className="mesh-gradient-bg" aria-hidden />
      <header
        className={[
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-white/15 bg-ink-950/75 shadow-xl shadow-black/20 backdrop-blur-2xl"
            : "border-white/10 bg-ink-950/55 backdrop-blur-xl",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              navigateWithTransition("/");
            }}
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-loop-500 to-teal-600 shadow-lg shadow-loop-900/40 ring-1 ring-white/20">
              <img src="/logo.png" alt="Sustainex logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">Sustainex</p>
              <p className="text-xs text-ink-400">Circular supply intelligence</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => navigateWithTransition(item.to)}
                className={[
                  "future-nav-chip rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
                  activeNav === item.to
                    ? "bg-white/12 text-white shadow-inner shadow-white/10 is-active"
                    : "text-ink-400 hover:bg-white/7 hover:text-ink-100",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {authName ? (
              <span className="hidden rounded-full border border-neon-300/35 bg-neon-500/10 px-3 py-1 text-xs font-medium text-neon-300 sm:inline">
                Logged in: {authName}
              </span>
            ) : null}
            <span className="hidden rounded-full border border-loop-500/30 bg-loop-500/10 px-3 py-1 text-xs font-medium text-loop-300 sm:inline">
              Demo dataset
            </span>
            {authName ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
              >
                Logout
              </button>
            ) : null}
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary rounded-lg px-3 py-2 text-xs font-medium"
            >
              API docs
            </a>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
          {nav.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => navigateWithTransition(item.to)}
                className={[
                  "future-nav-chip whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeNav === item.to ? "bg-loop-600 text-white is-active" : "bg-white/5 text-ink-300",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="vt-main relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-ink-500">
        Sustainex Circular Intelligence — hackathon build · Digital Product Passport + routing + impact analytics
      </footer>
    </div>
  );
}
