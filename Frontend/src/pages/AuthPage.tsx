import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, authSession } from "@/lib/api";

type Mode = "login" | "signup";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionId = authSession.getSessionId();
    if (!sessionId) return;
    api
      .me(sessionId)
      .then((res) => setMessage(`Already logged in as ${res.name}.`))
      .catch(() => authSession.clear());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await api.signup(name, email, password);
        setMessage(`Account created for ${res.email}. You can now login.`);
        setMode("login");
      } else {
        const res = await api.login(email, password);
        authSession.set(res.session_id, res.name);
        setMessage(`Welcome back, ${res.name}.`);
        setTimeout(() => navigate("/"), 500);
      }
    } catch (err) {
      const raw = (err as Error).message || "";
      const normalized = raw.toLowerCase();
      if (mode === "signup" && normalized.includes("account already exists")) {
        setError(
          `An account with ${email.trim().toLowerCase()} already exists. Please login with this email and your password.`,
        );
        setMode("login");
      } else if (mode === "login" && normalized.includes("no account found")) {
        setError("No account found for this email. Please create an account first.");
      } else {
        setError(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="glass-panel p-7">
        <h1 className="font-display text-3xl font-bold text-white">{mode === "login" ? "Login" : "Create Account"}</h1>
        <p className="mt-2 text-sm text-ink-400">Access your Sustainex dashboard and track circular journeys.</p>

        <div className="mt-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-4 py-2 text-sm ${mode === "login" ? "bg-loop-500 text-white" : "text-ink-300"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-4 py-2 text-sm ${mode === "signup" ? "bg-loop-500 text-white" : "text-ink-300"}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "signup" ? (
            <label className="block text-sm text-ink-300">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          ) : null}
          <label className="block text-sm text-ink-300">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-ink-300">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </div>
    </div>
  );
}
