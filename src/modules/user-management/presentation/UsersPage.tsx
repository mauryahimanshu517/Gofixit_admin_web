import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Card } from '@/core/components/ui';
import { Pagination } from '@/core/components/Pagination';

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'tailor', label: 'Tailor' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'city_admin', label: 'City admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
];

const ROLE_TABS = [
  { key: 'all', label: 'All', match: '' },
  { key: 'customer', label: 'Customers', match: 'customer' },
  { key: 'tailor', label: 'Tailors', match: 'tailor' },
  { key: 'vendor', label: 'Vendors', match: 'vendor' },
  { key: 'admin', label: 'Admins', match: 'super_admin' },
] as const;

type RoleKey = (typeof ROLE_TABS)[number]['key'];

export default function UsersPage() {
  const [role, setRole] = useState<RoleKey>('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  // Debounce search to one query per 300ms.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [role, debouncedQ]);

  const roleMatch = ROLE_TABS.find((t) => t.key === role)?.match ?? '';
  const queryKey = ['admin-users', roleMatch, debouncedQ, page];

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleMatch) params.set('role', roleMatch);
      if (debouncedQ) params.set('q', debouncedQ);
      params.set('page', String(page));
      const r = await api.get(`/admin/users?${params.toString()}`);
      return { items: r.data.data as any[], meta: r.data.meta };
    },
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];

  return (
    <section>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Users</h2>
      <p style={{ color: 'var(--muted)', margin: '0 0 20px', fontSize: 13 }}>
        Search and inspect every account on the platform — customers, partners, and admins.
      </p>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {ROLE_TABS.map((t) => {
          const active = t.key === role;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setRole(t.key)}
              aria-pressed={active}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                background: active ? 'var(--primary)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 360 }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone, or email…"
          aria-label="Search users"
          style={{
            width: '100%',
            padding: '10px 36px 10px 14px',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 14,
            background: 'var(--surface)',
          }}
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 880 }}>
            <thead style={{ background: 'var(--primary-soft)', textAlign: 'left' }}>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Phone</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Gender</th>
                <th style={th}>Joined</th>
                <th style={{ ...th, textAlign: 'right' }}>Addresses</th>
                <th style={{ ...th, textAlign: 'right' }}>Family</th>
                <th style={{ ...th, textAlign: 'right' }}>Wishlist</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u: any) => (
                <tr
                  key={u._id}
                  onClick={() => setOpenId(u._id)}
                  style={{
                    borderTop: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={td}>{u.name || <em style={muted}>Unnamed</em>}</td>
                  <td style={td}>{formatPhone(u.phone)}</td>
                  <td style={td}>{u.email || <em style={muted}>—</em>}</td>
                  <td style={td}>
                    <RoleBadge role={u.role} />
                  </td>
                  <td style={td}>{u.gender ? cap(u.gender) : <em style={muted}>—</em>}</td>
                  <td style={td}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{u.addressCount ?? 0}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{u.familyCount ?? 0}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{u.wishlistCount ?? 0}</td>
                </tr>
              ))}
              {!isFetching && items.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                    No users match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination meta={data?.meta} page={page} onPage={setPage} />

      {openId && <UserDrawer id={openId} onClose={() => setOpenId(null)} />}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail drawer                                                              */
/* -------------------------------------------------------------------------- */

function UserDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => (await api.get(`/admin/users/${id}`)).data.data as any,
  });
  const [actionError, setActionError] = useState('');

  // ESC to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const invalidateLists = () => {
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    qc.invalidateQueries({ queryKey: ['admin-user', id] });
  };

  const roleMut = useMutation({
    mutationFn: (role: string) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      setActionError('');
      invalidateLists();
    },
    onError: (e: any) =>
      setActionError(e?.response?.data?.error?.message ?? e?.message ?? 'Could not change role'),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      invalidateLists();
      onClose();
    },
    onError: (e: any) =>
      setActionError(e?.response?.data?.error?.message ?? e?.message ?? 'Could not delete user'),
  });

  const confirmDelete = () => {
    const label = data?.name || data?.phone || 'this user';
    const ok = window.confirm(
      `Delete ${label}?\n\nThis also deletes their tailor/vendor profile and services. Orders and bookings will remain in history. This cannot be undone.`
    );
    if (ok) deleteMut.mutate();
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.32)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 100%)',
          background: 'var(--bg)',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '-12px 0 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20 }}>{data?.name || (isLoading ? 'Loading…' : 'User')}</h3>
            {data && (
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                {formatPhone(data.phone)}
                {data.email ? ` · ${data.email}` : ''}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: 22,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {isLoading || !data ? (
          <p style={{ color: 'var(--muted)', marginTop: 20 }}>Loading…</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <RoleBadge role={data.role} />
              {data.gender && <Tag>{cap(data.gender)}</Tag>}
              {data.dob && <Tag>DOB: {new Date(data.dob).toLocaleDateString('en-IN')}</Tag>}
              <Tag>Joined {new Date(data.createdAt).toLocaleDateString('en-IN')}</Tag>
            </div>

            {/* Admin actions */}
            <Section title="Admin actions">
              <div style={addressRow}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <label
                    htmlFor="role-select"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                    }}
                  >
                    Role
                  </label>
                  <select
                    id="role-select"
                    value={data.role}
                    onChange={(e) => roleMut.mutate(e.target.value)}
                    disabled={roleMut.isPending || deleteMut.isPending}
                    style={{
                      flex: 1,
                      minWidth: 160,
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 13,
                      background: 'var(--surface)',
                    }}
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {roleMut.isPending && (
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>Saving…</span>
                  )}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                  Changing role takes effect immediately on the user's next request.
                </p>
              </div>

              <div
                style={{
                  ...addressRow,
                  borderColor: 'var(--danger)',
                  background: '#FDEDED20',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--danger)' }}>
                      Delete user
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                      Removes the account and any tailor/vendor profile + their services. Orders
                      and bookings are kept in history.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleteMut.isPending || roleMut.isPending}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--danger)',
                      background: 'var(--danger)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: deleteMut.isPending ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: deleteMut.isPending ? 0.7 : 1,
                    }}
                  >
                    {deleteMut.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>

              {actionError && (
                <div
                  role="alert"
                  style={{
                    background: '#FDEDED',
                    color: 'var(--danger)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  {actionError}
                </div>
              )}
            </Section>

            <Section title={`Addresses (${data.addresses?.length ?? 0})`}>
              {(data.addresses ?? []).length === 0 && <Empty text="No saved addresses." />}
              {(data.addresses ?? []).map((a: any) => (
                <div key={a._id ?? `${a.line1}-${a.pincode}`} style={addressRow}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {a.label || 'Address'}
                    {a.isDefault && <Tag style={{ marginLeft: 6 }}>Default</Tag>}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                    {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                  </div>
                </div>
              ))}
            </Section>

            <Section title={`Family profiles (${data.familyProfiles?.length ?? 0})`}>
              {(data.familyProfiles ?? []).length === 0 && <Empty text="No family profiles." />}
              {(data.familyProfiles ?? []).map((f: any) => (
                <div key={f._id} style={addressRow}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{f.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                    {[f.relation, f.gender && cap(f.gender)].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
            </Section>

            <Section title={`Saved measurements (${data.savedMeasurements?.length ?? 0})`}>
              {(data.savedMeasurements ?? []).length === 0 && <Empty text="No saved measurements." />}
              {(data.savedMeasurements ?? []).map((m: any) => (
                <div key={m._id} style={addressRow}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {m.profileName || 'Measurement'}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    {m.gender ? cap(m.gender) : ''} · {Object.keys(m.fields ?? {}).length} fields
                  </div>
                </div>
              ))}
            </Section>

            <Section title={`Wishlist (${data.wishlist?.length ?? 0})`}>
              {(data.wishlist ?? []).length === 0 && <Empty text="Nothing wishlisted yet." />}
              {(data.wishlist ?? []).map((t: any) => (
                <div
                  key={t._id}
                  style={{
                    ...addressRow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {t.profileImage ? (
                    <img
                      src={t.profileImage}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      aria-hidden
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--primary-soft)',
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{t.shopName}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                      ★ {t.rating ?? 0} ({t.reviewCount ?? 0}) · From ₹{t.startingPrice ?? 0}
                    </div>
                  </div>
                </div>
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small reusables + styles                                                   */
/* -------------------------------------------------------------------------- */

function RoleBadge({ role }: { role?: string }) {
  if (!role) return <em style={muted}>—</em>;
  const color =
    role === 'super_admin' || role === 'admin'
      ? '#7A1F3D'
      : role === 'tailor' || role === 'vendor'
        ? '#1B5E20'
        : 'var(--muted)';
  const bg =
    role === 'super_admin' || role === 'admin'
      ? '#F7E8EE'
      : role === 'tailor' || role === 'vendor'
        ? '#E8F5E9'
        : 'var(--bg)';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 800,
        background: bg,
        color,
        textTransform: 'capitalize',
        letterSpacing: 0.3,
      }}
    >
      {role.replace('_', ' ')}
    </span>
  );
}

function Tag({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.6,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>{text}</div>
  );
}

function formatPhone(p?: string): string {
  if (!p) return '—';
  if (p.startsWith('google:')) return 'Google sign-in';
  if (/^\d{10}$/.test(p)) return `+91 ${p.slice(0, 5)} ${p.slice(5)}`;
  if (/^91\d{10}$/.test(p)) return `+91 ${p.slice(2, 7)} ${p.slice(7)}`;
  return p;
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const th: React.CSSProperties = {
  padding: '12px 14px',
  fontWeight: 700,
  fontSize: 12,
  color: 'var(--text)',
};
const td: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
};
const muted: React.CSSProperties = { color: 'var(--muted)', fontStyle: 'normal' };
const addressRow: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 12px',
};
