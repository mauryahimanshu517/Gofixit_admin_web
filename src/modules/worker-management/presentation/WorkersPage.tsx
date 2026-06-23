import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Card } from '@/core/components/ui';

/** Worker Management — platform-wide view of vendor staff (req. #4 worker-management). */
export default function WorkersPage() {
  const { data } = useQuery({
    queryKey: ['admin-workers'],
    queryFn: async () => (await api.get('/workers')).data.data,
  });

  return (
    <section>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>Workers & Staff</h2>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: 'var(--primary-soft)', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: 12 }}>Name</th>
              <th>Phone</th>
              <th>Skills</th>
              <th>Available</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((w: any) => (
              <tr key={w._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: 12 }}>{w.name}</td>
                <td>{w.phone ?? '—'}</td>
                <td>{(w.skills ?? []).join(', ') || '—'}</td>
                <td>{w.isAvailable ? 'Yes' : 'No'}</td>
                <td>★ {w.rating ?? 0}</td>
              </tr>
            ))}
            {!data?.length && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No workers yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
