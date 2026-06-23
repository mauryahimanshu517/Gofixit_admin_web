import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Card, Button, Input } from '@/core/components/ui';

/** Payout Management — settle vendor earnings minus commission (req. #8 manage payouts). */
export default function PayoutsPage() {
  const qc = useQueryClient();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => (await api.get('/payouts')).data.data,
  });

  const generate = useMutation({
    mutationFn: () => api.post('/payouts/generate', { from, to }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] }),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => api.patch(`/payouts/${id}/mark-paid`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-payouts'] }),
  });

  return (
    <section>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>Payouts</h2>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Generate settlement</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}><Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div style={{ flex: 1, minWidth: 160 }}><Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <Button onClick={() => generate.mutate()} loading={generate.isPending} disabled={!from || !to}>Generate</Button>
        </div>
        {generate.isError && <div role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{(generate.error as Error).message}</div>}
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: 'var(--primary-soft)', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: 12 }}>Vendor</th><th>Period</th><th>Gross</th><th>Commission</th><th>Net</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p: any) => (
              <tr key={p._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>{String(p.vendorId).slice(-6)}</td>
                <td style={{ fontSize: 12 }}>{p.periodFrom ? new Date(p.periodFrom).toLocaleDateString() : '—'} → {p.periodTo ? new Date(p.periodTo).toLocaleDateString() : '—'}</td>
                <td>₹{p.breakdown?.gross ?? 0}</td>
                <td>₹{p.breakdown?.commission ?? 0}</td>
                <td style={{ fontWeight: 700 }}>₹{p.breakdown?.net ?? 0}</td>
                <td>{p.status}</td>
                <td>{p.status !== 'paid' && <Button onClick={() => markPaid.mutate(p._id)} style={{ fontSize: 12, padding: '4px 10px', minHeight: 28 }}>Mark paid</Button>}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No payouts yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
