import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Card, Button, Input } from '@/core/components/ui';

/** Pricing Management · Cities — multi-city pricing & live surge multipliers (req. #14). */
export default function CitiesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: async () => (await api.get('/cities')).data.data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/cities', {
        key: form.key,
        name: form.name,
        state: form.state,
        pricingMultiplier: Number(form.pricingMultiplier ?? 1),
        surgeMultiplier: Number(form.surgeMultiplier ?? 1),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-cities'] }); setForm({}); },
  });

  const updateSurge = useMutation({
    mutationFn: ({ id, surge }: { id: string; surge: number }) => api.patch(`/cities/${id}`, { surgeMultiplier: surge }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-cities'] }),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <section>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>Cities & Surge</h2>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <Input label="Key" value={form.key ?? ''} onChange={(e) => set('key', e.target.value)} />
          <Input label="Name" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          <Input label="State" value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} />
          <Input label="Price ×" type="number" value={form.pricingMultiplier ?? ''} onChange={(e) => set('pricingMultiplier', e.target.value)} placeholder="1" />
          <Input label="Surge ×" type="number" value={form.surgeMultiplier ?? ''} onChange={(e) => set('surgeMultiplier', e.target.value)} placeholder="1" />
        </div>
        <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!form.key || !form.name} style={{ marginTop: 12 }}>Add city</Button>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: 'var(--primary-soft)', textAlign: 'left' }}>
            <tr><th style={{ padding: 12 }}>City</th><th>State</th><th>Price ×</th><th>Surge ×</th><th></th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((c: any) => (
              <tr key={c._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: 12 }}>{c.name}</td>
                <td>{c.state ?? '—'}</td>
                <td>{c.pricingMultiplier}</td>
                <td>{c.surgeMultiplier}</td>
                <td style={{ display: 'flex', gap: 6, padding: 8 }}>
                  <Button variant="outline" style={{ fontSize: 12, padding: '4px 8px', minHeight: 28 }} onClick={() => updateSurge.mutate({ id: c._id, surge: Math.max(1, (c.surgeMultiplier ?? 1) - 0.25) })}>−</Button>
                  <Button variant="outline" style={{ fontSize: 12, padding: '4px 8px', minHeight: 28 }} onClick={() => updateSurge.mutate({ id: c._id, surge: (c.surgeMultiplier ?? 1) + 0.25 })}>+ surge</Button>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No cities yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
