import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/core/store/auth';
import AdminLayout from '@/core/layout/AdminLayout';
import LoginPage from '@/core/auth/LoginPage';
import { getModules } from '@/core/registry/moduleRegistry';
import '@/modules'; // side-effect: register all admin modules into the registry

export default function App() {
  const { user, loading, hydrate } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (loading) {
    return (
      <div role="status" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const modules = getModules();
  const home = modules[0]?.path ?? 'dashboard';

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        {modules.map((m) => (
          <Route key={m.id} path={`/${m.path}`} element={<m.Component />} />
        ))}
        <Route path="*" element={<Navigate to={`/${home}`} replace />} />
      </Route>
    </Routes>
  );
}
