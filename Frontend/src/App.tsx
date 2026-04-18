import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { HomePage } from "@/pages/HomePage";
import { AuthPage } from "@/pages/AuthPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { RouterLabPage } from "@/pages/RouterLabPage";
import { api, authSession } from "@/lib/api";

function useAuthStatus() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const sid = authSession.getSessionId();
    if (!sid) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    api
      .me(sid)
      .then(() => setAuthenticated(true))
      .catch(() => {
        authSession.clear();
        setAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, authenticated };
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const { loading, authenticated } = useAuthStatus();

  if (loading) {
    return <div className="glass-panel p-6 text-ink-300">Checking login session...</div>;
  }
  if (!authenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function PublicOnlyAuthPage() {
  const { loading, authenticated } = useAuthStatus();

  if (loading) {
    return <div className="glass-panel p-6 text-ink-300">Checking login session...</div>;
  }
  if (authenticated) {
    return <Navigate to="/" replace />;
  }
  return <AuthPage />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/auth" element={<PublicOnlyAuthPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/products"
          element={
            <RequireAuth>
              <ProductsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/products/:id"
          element={
            <RequireAuth>
              <ProductDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/router"
          element={
            <RequireAuth>
              <RouterLabPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Layout>
  );
}
