import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Card, StatCard } from '@/core/components/ui';

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data.data,
  });

  if (!data) return <div role="status">Loading…</div>;

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>Overview</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard label="Orders today" value={data.ordersToday} />
        <StatCard label="GMV" value={`₹${data.gmv}`} />
        <StatCard label="Active tailors" value={data.activeTailors} />
        <StatCard label="Customers" value={data.totalUsers} />
        <StatCard label="Repeat rate" value={`${data.repeatRate}%`} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
          marginTop: 24,
        }}
      >
        <Card>
          <h3 style={{ margin: 0, fontSize: 16 }}>Top categories</h3>
          <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
            {(data.topCategories ?? []).map((c: any) => (
              <li
                key={c.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 14,
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{c.label}</span>
                <span style={{ fontWeight: 700 }}>{c.views}</span>
              </li>
            ))}
            {!data.topCategories?.length && (
              <li style={{ color: 'var(--muted)', fontSize: 13 }}>No events yet</li>
            )}
          </ul>
        </Card>

        <Card>
          <h3 style={{ margin: 0, fontSize: 16 }}>Orders trend (14d)</h3>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'end', gap: 4, height: 120 }}>
            {(data.ordersTrend ?? []).map((d: any) => {
              const max = Math.max(...data.ordersTrend.map((x: any) => x.count), 1);
              const h = (d.count / max) * 100;
              return (
                <div
                  key={d.d}
                  title={`${d.d}: ${d.count}`}
                  style={{
                    flex: 1,
                    background: 'var(--primary)',
                    height: `${Math.max(h, 4)}%`,
                    borderRadius: 4,
                  }}
                />
              );
            })}
            {!data.ordersTrend?.length && (
              <div style={{ color: 'var(--muted)', fontSize: 13, alignSelf: 'center' }}>
                No data yet
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
