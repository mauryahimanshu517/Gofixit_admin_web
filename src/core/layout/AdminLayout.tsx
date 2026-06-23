import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/core/store/auth';
import { getModules } from '@/core/registry/moduleRegistry';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const modules = getModules();

  // Group modules for the sidebar, preserving registration/order.
  const groups: { name: string; items: typeof modules }[] = [];
  for (const m of modules) {
    const name = m.group ?? 'General';
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, items: [] }));
    g.items.push(m);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{ width: 248, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: 20, overflowY: 'auto' }}
        aria-label="Primary navigation"
      >
        <div>
          <img
            src="https://www.gofixit.in/_next/image?url=%2Flogo.png&w=384&q=75"
            alt="GoFixit"
            style={{ height: 28, width: 'auto', display: 'block' }}
          />
          <div
            style={{
              color: 'var(--muted)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            Admin
          </div>
        </div>
        <nav style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map((g) => (
            <div key={g.name}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: 0.5, padding: '0 14px 6px' }}>
                {g.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {g.items.map((m) => (
                  <NavLink
                    key={m.id}
                    to={`/${m.path}`}
                    style={({ isActive }) => ({
                      padding: '9px 14px',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 14,
                      color: isActive ? 'var(--primary)' : 'var(--text)',
                      background: isActive ? 'var(--primary-soft)' : 'transparent',
                    })}
                  >
                    {m.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Multi-service operations control</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</span>
            <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>
              Logout
            </button>
          </div>
        </header>
        <main style={{ padding: 24, flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
