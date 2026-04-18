import type {
  DashboardMetrics,
  MaterialInsight,
  ProductPassport,
  RoutingDecision,
  RoutingAction,
  ProductCondition,
} from "@/types";

const BASE = import.meta.env.VITE_API_URL || "https://sustainex-production.up.railway.app";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      if (parsed?.detail) detail = parsed.detail;
    } catch {
      // Keep plain text fallback if response is not JSON.
    }
    throw new Error(detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

async function fetchMultipart<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST", body });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const parsed = JSON.parse(text) as { detail?: string };
      if (parsed?.detail) detail = parsed.detail;
    } catch {
      // Keep plain text fallback if response is not JSON.
    }
    throw new Error(detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => fetchJson<{ status: string }>("/health"),
  listProducts: () => fetchJson<ProductPassport[]>("/products"),
  getProduct: (id: string) => fetchJson<ProductPassport>(`/products/${encodeURIComponent(id)}`),
  createProduct: (passport: ProductPassport) =>
    fetchJson<ProductPassport>("/products", {
      method: "POST",
      body: JSON.stringify(passport),
    }),
  uploadProduct: (payload: FormData) => fetchMultipart<ProductPassport>("/products/upload", payload),
  decide: (productId: string, override?: ProductCondition) =>
    fetchJson<RoutingDecision>("/routing/decide", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, override_condition: override ?? null }),
    }),
  materials: (productId: string) =>
    fetchJson<MaterialInsight>(`/materials/insights/${encodeURIComponent(productId)}`),
  dashboard: () => fetchJson<DashboardMetrics>("/analytics/dashboard"),
  facilities: () => fetchJson<Array<Record<string, unknown>>>("/facilities"),
  simulateReturn: (productId: string) =>
    fetchJson<{
      passport: ProductPassport;
      routing: RoutingDecision;
      materials: MaterialInsight;
    }>(`/demo/return/${encodeURIComponent(productId)}`, { method: "POST" }),
  signup: (name: string, email: string, password: string) =>
    fetchJson<{ message: string; email: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    fetchJson<{ message: string; email: string; name: string; session_id: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: (sessionId: string) =>
    fetchJson<{ email: string; name: string }>(`/auth/me?session_id=${encodeURIComponent(sessionId)}`),
  logout: (sessionId: string) =>
    fetchJson<{ message: string }>(`/auth/logout?session_id=${encodeURIComponent(sessionId)}`, { method: "POST" }),
};

const SESSION_KEY = "sustainex_session_id";
const USER_KEY = "sustainex_user_name";
export const authSession = {
  set(sessionId: string, userName: string) {
    localStorage.setItem(SESSION_KEY, sessionId);
    localStorage.setItem(USER_KEY, userName);
  },
  getSessionId() {
    return localStorage.getItem(SESSION_KEY) || "";
  },
  getUserName() {
    return localStorage.getItem(USER_KEY) || "";
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export function actionLabel(a: RoutingAction): string {
  const map: Record<RoutingAction, string> = {
    reuse: "Reuse",
    refurbish: "Refurbish",
    recycle: "Recycle",
  };
  return map[a];
}

export function conditionLabel(c: ProductCondition): string {
  const map: Record<ProductCondition, string> = {
    new: "New",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    end_of_life: "End of life",
  };
  return map[c];
}
