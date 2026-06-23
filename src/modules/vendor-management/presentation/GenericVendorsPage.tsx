import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Button, Card } from '@/core/components/ui';
import { Pagination } from '@/core/components/Pagination';

/**
 * Unified vendor moderation. The backend serves generic Vendors UNION legacy Tailors
 * (mapped through LEGACY_TAILOR_PROJECTION) from /admin/vendors, so this page is the single
 * KYC moderation surface for every service category — tailoring, car-wash, electrician, grocery, …
 * Without approving here, new registrations stay 'pending' and never appear in the customer app.
 */
export default function GenericVendorsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');

  const { data } = useQuery({
    queryKey: ['admin-vendors', filter, page],
    queryFn: async () => {
      const qs = `?page=${page}${filter === 'all' ? '' : `&status=${filter}`}`;
      const r = await api.get(`/admin/vendors${qs}`);
      return { items: r.data.data as any[], meta: r.data.meta };
    },
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-vendors'] });
  const onErr = (e: any) =>
    setActionError(e?.response?.data?.error?.message ?? e?.message ?? 'Action failed');

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/vendors/${id}/approve`),
    onSuccess: () => {
      invalidate();
      setActionError('');
    },
    onError: onErr,
  });
  const reject = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/vendors/${id}/reject`),
    onSuccess: () => {
      invalidate();
      setActionError('');
    },
    onError: onErr,
  });
  const reopen = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/vendors/${id}/reopen`),
    onSuccess: () => {
      invalidate();
      setActionError('');
    },
    onError: onErr,
  });
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/vendors/${id}/active`, { isActive }),
    onSuccess: () => {
      invalidate();
      setActionError('');
    },
    onError: onErr,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/vendors/${id}`),
    onSuccess: () => {
      invalidate();
      setActionError('');
    },
    onError: onErr,
  });

  const askDelete = (v: any) => {
    const label = v.businessName || v.ownerName || 'this vendor';
    const ok = window.confirm(
      `Delete ${label}?\n\nThis removes the vendor and all of their services / offerings. Bookings and orders remain in history. This cannot be undone.`
    );
    if (ok) remove.mutate(v._id);
  };

  return (
    <section>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Vendors</h2>
      <p style={{ color: 'var(--muted)', margin: '0 0 20px', fontSize: 13 }}>
        Moderate KYC, suspend or re-enable shops, and remove inactive vendors. Removing a vendor
        wipes their service catalogue — bookings stay intact.
      </p>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'outline'}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
          </Button>
        ))}
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
            marginBottom: 12,
          }}
        >
          {actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {items.map((v: any) => {
          const isActive = v.isActive !== false;
          const isPending = v.kycStatus === 'pending';
          const isApproved = v.kycStatus === 'approved';
          const isRejected = v.kycStatus === 'rejected';
          const busy =
            (approve.isPending && approve.variables === v._id) ||
            (reject.isPending && reject.variables === v._id) ||
            (reopen.isPending && reopen.variables === v._id) ||
            (remove.isPending && remove.variables === v._id) ||
            (toggleActive.isPending && toggleActive.variables?.id === v._id);

          return (
            <Card key={v._id} style={{ opacity: isActive ? 1 : 0.75 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {v.profileImage ? (
                  <img
                    src={v.profileImage}
                    alt={`${v.businessName}`}
                    style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      background: 'var(--primary-soft)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 22,
                    }}
                  >
                    🛠️
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 15, lineHeight: 1.25 }}>
                    {v.businessName}
                  </h3>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    {v.ownerName ?? '—'} • <strong>{v.serviceTypeKey}</strong>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    ★ {v.rating ?? 0} ({v.reviewCount ?? 0})
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <KycPill status={v.kycStatus} />
                    <ActivePill isActive={isActive} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {isPending && (
                  <>
                    <Button onClick={() => approve.mutate(v._id)} disabled={busy}>
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => reject.mutate(v._id)} disabled={busy}>
                      Reject
                    </Button>
                  </>
                )}
                {isApproved && (
                  <Button
                    variant="outline"
                    onClick={() => toggleActive.mutate({ id: v._id, isActive: !isActive })}
                    disabled={busy}
                    style={{ flex: 1 }}
                  >
                    {isActive ? 'Suspend' : 'Reactivate'}
                  </Button>
                )}
                {isRejected && (
                  <Button
                    variant="outline"
                    onClick={() => reopen.mutate(v._id)}
                    disabled={busy}
                    style={{ flex: 1 }}
                  >
                    Re-open review
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => askDelete(v)}
                  disabled={busy}
                  style={{
                    color: 'var(--danger)',
                    borderColor: 'var(--danger)',
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
        {!items.length && <div style={{ color: 'var(--muted)' }}>No vendors in this bucket</div>}
      </div>

      <Pagination meta={data?.meta} page={page} onPage={setPage} />
    </section>
  );
}

function KycPill({ status }: { status?: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    approved: { bg: '#E8F5E9', fg: '#1B5E20' },
    pending: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
    rejected: { bg: '#FCE4E4', fg: '#9b1c1c' },
  };
  const p = palette[status ?? ''] ?? { bg: 'var(--bg)', fg: 'var(--muted)' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        background: p.bg,
        color: p.fg,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}
    >
      KYC · {status ?? '—'}
    </span>
  );
}

function ActivePill({ isActive }: { isActive: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        background: isActive ? '#E8F5E9' : '#FCE4E4',
        color: isActive ? '#1B5E20' : '#9b1c1c',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}
    >
      {isActive ? 'Open' : 'Suspended'}
    </span>
  );
}
