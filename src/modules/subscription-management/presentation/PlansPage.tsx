import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Card, Button, Input } from '@/core/components/ui';

/** Subscription Management — vendor & customer plans (req. #8 manage subscriptions). */
export default function PlansPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({ audience: 'vendor', interval: 'monthly' });

  const { data } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => (await api.get('/subscriptions/plans')).data.data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/subscriptions/plans', {
        key: form.key,
        name: form.name,
        audience: form.audience,
        interval: form.interval,
        price: Number(form.price ?? 0),
        features: (form.features ?? '').split(',').map((f) => f.trim()).filter(Boolean),
        commissionDiscountPercent: form.commissionDiscountPercent ? Number(form.commissionDiscountPercent) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      setForm({ audience: 'vendor', interval: 'monthly' });
    },
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <section>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>Subscription Plans</h2>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>New plan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <Input label="Key" value={form.key ?? ''} onChange={(e) => set('key', e.target.value)} />
          <Input label="Name" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          <Input label="Price (₹)" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} />
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Audience</label>
            <select value={form.audience} onChange={(e) => set('audience', e.target.value)} style={selectStyle}>
              <option value="vendor">Vendor</option><option value="customer">Customer</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Interval</label>
            <select value={form.interval} onChange={(e) => set('interval', e.target.value)} style={selectStyle}>
              <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
            </select>
          </div>
          <Input label="Features (comma-sep)" value={form.features ?? ''} onChange={(e) => set('features', e.target.value)} />
          <Input label="Commission discount %" type="number" value={form.commissionDiscountPercent ?? ''} onChange={(e) => set('commissionDiscountPercent', e.target.value)} />
        </div>
        <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!form.key || !form.name} style={{ marginTop: 12 }}>Create plan</Button>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {(data ?? []).map((p: any) => (
          <Card key={p._id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{p.name}</h3>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.audience}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>₹{p.price}<span style={{ fontSize: 12, color: 'var(--muted)' }}>/{p.interval}</span></div>
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--muted)' }}>
              {(p.features ?? []).map((f: string, i: number) => <li key={i}>{f}</li>)}
            </ul>
          </Card>
        ))}
        {!data?.length && <div style={{ color: 'var(--muted)' }}>No plans yet</div>}
      </div>
    </section>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 15, background: 'var(--surface)',
};
