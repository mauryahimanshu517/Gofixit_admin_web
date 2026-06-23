import { useQuery } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Card, StatCard } from '@/core/components/ui';

/** Reports — exportable platform summary (req. #4 reports). Builds on /admin/stats for now. */
export default function ReportsPage() {
  const { data } = useQuery({
    queryKey: ['admin-stats-report'],
    queryFn: async () => (await api.get('/admin/stats')).data.data,
  });

  const exportCsv = () => {
    const rows = (data?.ordersTrend ?? []).map((d: any) => `${d.d},${d.count}`);
    const csv = 'date,orders\n' + rows.join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'orders-trend.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Reports</h2>
        <button onClick={exportCsv} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600 }}>
          Export orders CSV
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="GMV" value={`₹${data?.gmv ?? 0}`} />
        <StatCard label="Orders today" value={data?.ordersToday ?? 0} />
        <StatCard label="Active vendors" value={data?.activeTailors ?? 0} />
        <StatCard label="Customers" value={data?.totalUsers ?? 0} />
      </div>
    </section>
  );
}
