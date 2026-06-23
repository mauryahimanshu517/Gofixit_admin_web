import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Button, Card } from '@/core/components/ui';
import { Pagination } from '@/core/components/Pagination';

export default function TailorsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['admin-tailors', filter, page],
    queryFn: async () => {
      const qs = `?page=${page}${filter === 'all' ? '' : `&status=${filter}`}`;
      const r = await api.get(`/admin/tailors${qs}`);
      return { items: r.data.data as any[], meta: r.data.meta };
    },
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/tailors/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tailors'] }),
  });
  const reject = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/tailors/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tailors'] }),
  });

  return (
    <section>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>Tailors</h2>

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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        {items.map((t: any) => (
          <Card key={t._id}>
            <div style={{ display: 'flex', gap: 12 }}>
              <img
                src={t.profileImage}
                alt={`${t.shopName} shop`}
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{t.shopName}</h3>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                  {t.ownerName} • {t.specializations?.join(', ')}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                  ★ {t.rating} ({t.reviewCount})
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: 6,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {t.kycStatus}
                </div>
              </div>
            </div>
            {t.kycStatus !== 'approved' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button onClick={() => approve.mutate(t._id)}>Approve</Button>
                <Button variant="outline" onClick={() => reject.mutate(t._id)}>
                  Reject
                </Button>
              </div>
            )}
          </Card>
        ))}
        {!items.length && <div style={{ color: 'var(--muted)' }}>No tailors in this bucket</div>}
      </div>

      <Pagination meta={data?.meta} page={page} onPage={setPage} />
    </section>
  );
}
