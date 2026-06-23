import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Button, Card } from '@/core/components/ui';
import { Pagination } from '@/core/components/Pagination';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: ['admin-orders', page],
    queryFn: async () => {
      const r = await api.get(`/admin/orders?page=${page}`);
      return { items: r.data.data as any[], meta: r.data.meta };
    },
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];

  const [selected, setSelected] = useState<any | null>(null);

  return (
    <section>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>All orders</h2>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: 'var(--primary-soft)', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: 12 }}>Order</th>
              <th>Customer</th>
              <th>Tailor</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o: any) => (
              <tr
                key={o._id}
                onClick={() => setSelected(o)}
                style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: 12, fontFamily: 'monospace' }}>#{o.orderNo}</td>
                <td>{o.customerId?.name}</td>
                <td>{o.tailorId?.shopName}</td>
                <td>{o.status}</td>
                <td>₹{o.pricing?.total}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                  No orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Pagination meta={data?.meta} page={page} onPage={setPage} />

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function OrderDetailModal({ order, onClose }: { order: any; onClose: () => void }) {
  const addr = order.address ?? {};
  const addrLine = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 720,
          padding: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Order #{order.orderNo}</h3>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              Placed {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <Section title="Status">
          <Row label="Current" value={order.status} />
          <Row label="Urgent" value={order.urgent ? 'Yes' : 'No'} />
          <Row
            label="Delivery estimate"
            value={order.deliveryEstimate ? new Date(order.deliveryEstimate).toLocaleDateString() : '—'}
          />
        </Section>

        <Section title="Customer">
          <Row label="Name" value={order.customerId?.name ?? '—'} />
          <Row label="Phone" value={order.customerId?.phone ?? '—'} />
        </Section>

        <Section title="Tailor">
          <Row label="Shop" value={order.tailorId?.shopName ?? '—'} />
        </Section>

        <Section title="Items">
          {(order.items ?? []).length === 0 && <div style={{ color: 'var(--muted)' }}>No items</div>}
          {(order.items ?? []).map((it: any, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderTop: i ? '1px solid var(--border)' : 'none',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Qty {it.qty ?? 1} · {it.fittingType ?? 'regular'}
                  {it.customNote ? ` · ${it.customNote}` : ''}
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>₹{it.price ?? 0}</div>
            </div>
          ))}
        </Section>

        <Section title="Pricing">
          <Row label="Subtotal" value={`₹${order.pricing?.subtotal ?? 0}`} />
          <Row label="Urgent fee" value={`₹${order.pricing?.urgentFee ?? 0}`} />
          <Row label="Delivery fee" value={`₹${order.pricing?.deliveryFee ?? 0}`} />
          <Row label="Discount" value={`₹${order.pricing?.discount ?? 0}`} />
          {order.pricing?.coupon && <Row label="Coupon" value={order.pricing.coupon} />}
          <Row label="Total" value={`₹${order.pricing?.total ?? 0}`} bold />
        </Section>

        <Section title="Payment">
          <Row label="Mode" value={order.payment?.mode ?? '—'} />
          <Row label="Status" value={order.payment?.status ?? '—'} />
          {order.payment?.txnId && <Row label="Txn ID" value={order.payment.txnId} />}
        </Section>

        <Section title="Pickup & address">
          <Row
            label="Pickup"
            value={
              order.pickupSlot?.date
                ? `${new Date(order.pickupSlot.date).toLocaleDateString()} · ${order.pickupSlot.window ?? ''}`
                : '—'
            }
          />
          <Row label="Address" value={addrLine || '—'} />
          <Row label="Measurement" value={order.measurementMethod ?? '—'} />
          {order.preferredStaffGender && (
            <Row label="Preferred staff" value={order.preferredStaffGender} />
          )}
          {order.notes && <Row label="Notes" value={order.notes} />}
        </Section>

        {!!order.statusHistory?.length && (
          <Section title="Status history">
            {order.statusHistory.map((h: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  fontSize: 13,
                  borderTop: i ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ fontWeight: 600 }}>{h.status}</span>
                <span style={{ color: 'var(--muted)' }}>
                  {new Date(h.at).toLocaleString()} · {h.by ?? '—'}
                </span>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ background: 'var(--primary-soft)', borderRadius: 10, padding: 12 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
