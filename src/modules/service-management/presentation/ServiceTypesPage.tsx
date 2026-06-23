import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ServiceType } from '@stitchkart/ui-kit-web';
import { api } from '@/core/api/client';
import { uploadImage } from '@/core/api/uploads';
import { Card, Button, Input } from '@/core/components/ui';

const KINDS = ['appointment', 'on_demand', 'commerce', 'rental', 'delivery'];
const STRATEGIES = ['per_item', 'flat', 'hourly', 'distance', 'quote'];
const CAPS: { key: string; label: string }[] = [
  { key: 'needsScheduling', label: 'Scheduling' },
  { key: 'instantBooking', label: 'Instant booking' },
  { key: 'needsWorker', label: 'Workers/staff' },
  { key: 'needsInventory', label: 'Inventory' },
  { key: 'needsPickupDelivery', label: 'Pickup/Delivery' },
  { key: 'needsServiceArea', label: 'Service area' },
];

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const toKey = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/(^_|_$)/g, '');

/** Build a valid linear workflow (with cancel) from a list of stage labels. */
function buildWorkflow(labels: string[]) {
  const stages = labels.length ? labels : ['Requested', 'Confirmed', 'In progress', 'Completed'];
  const states = stages.map((l, i) => ({
    key: toKey(l),
    label: l,
    type: i === 0 ? 'initial' : i === stages.length - 1 ? 'terminal' : 'normal',
  }));
  states.push({ key: 'CANCELLED', label: 'Cancelled', type: 'terminal' });
  const transitions: any[] = [];
  for (let i = 0; i < stages.length - 1; i++) transitions.push({ from: states[i].key, to: states[i + 1].key });
  for (let i = 0; i < stages.length - 1; i++) transitions.push({ from: states[i].key, to: 'CANCELLED' });
  return { initial: states[0].key, states, transitions };
}

const EMPTY: any = {
  label: '', key: '', icon: '', imageUrl: '', description: '', kind: 'appointment',
  needsScheduling: true, instantBooking: false, needsWorker: false,
  needsInventory: false, needsPickupDelivery: false, needsServiceArea: true,
  states: 'Requested, Confirmed, In progress, Completed',
  strategy: 'per_item', commissionPercent: '15',
};

/** Map a saved service type back into the editable form shape (inverse of the create payload). */
function formFromService(s: any): any {
  const caps = s.capabilities ?? {};
  // Workflow stages minus the auto-generated CANCELLED state (re-added on save by buildWorkflow).
  const states = (s.workflow?.states ?? [])
    .filter((st: any) => st.key !== 'CANCELLED')
    .map((st: any) => st.label)
    .join(', ');
  return {
    label: s.label ?? '',
    key: s.key ?? '',
    icon: s.icon ?? '',
    imageUrl: s.imageUrl ?? '',
    description: s.description ?? '',
    kind: s.kind ?? 'appointment',
    needsScheduling: !!caps.needsScheduling,
    instantBooking: !!caps.instantBooking,
    needsWorker: !!caps.needsWorker,
    needsInventory: !!caps.needsInventory,
    needsPickupDelivery: !!caps.needsPickupDelivery,
    needsServiceArea: !!caps.needsServiceArea,
    states: states || 'Requested, Confirmed, In progress, Completed',
    strategy: s.pricing?.strategy ?? 'per_item',
    commissionPercent: String(s.pricing?.commissionPercent ?? '0'),
  };
}

/**
 * Service Management — the dynamic service registry (req. #8, #11, #12). Admins can ADD a new
 * service type here (no code/deploy); it immediately appears in the apps' marketplace + home.
 */
export default function ServiceTypesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  // null = creating a new service type; a key string = editing that existing one.
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  // Management list: ALL service types from the DB, including disabled ones (so they can be
  // re-enabled). The public `/service-types` route reflects the live registry and omits inactive.
  const { data } = useQuery<ServiceType[]>({
    queryKey: ['service-types', 'manage'],
    queryFn: async () => (await api.get('/service-types/manage/all')).data.data,
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingKey(null);
    setForm(EMPTY);
  };
  const startCreate = () => {
    setEditingKey(null);
    setForm(EMPTY);
    setShowForm(true);
  };
  const startEdit = (s: ServiceType) => {
    setEditingKey(s.key);
    setForm(formFromService(s));
    setShowForm(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const disable = useMutation({
    mutationFn: (key: string) => api.delete(`/service-types/${key}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-types'] }),
  });

  const enable = useMutation({
    mutationFn: (key: string) => api.post(`/service-types/${key}/enable`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-types'] }),
  });

  const create = useMutation({
    mutationFn: () => {
      const labels = String(form.states).split(',').map((s) => s.trim()).filter(Boolean);
      return api.post('/service-types', {
        key: form.key.trim() || slug(form.label),
        label: form.label.trim(),
        icon: form.icon.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        description: form.description.trim() || undefined,
        kind: form.kind,
        capabilities: {
          needsScheduling: form.needsScheduling, instantBooking: form.instantBooking,
          needsWorker: form.needsWorker, needsInventory: form.needsInventory,
          needsPickupDelivery: form.needsPickupDelivery, needsServiceArea: form.needsServiceArea,
        },
        workflow: buildWorkflow(labels),
        bookingForm: { fields: [{ key: 'notes', label: 'Notes', type: 'textarea' }] },
        pricing: { strategy: form.strategy, currency: 'INR', commissionPercent: Number(form.commissionPercent) || 0, taxPercent: 0 },
        isActive: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-types'] });
      closeForm();
    },
  });

  const update = useMutation({
    mutationFn: () => {
      const original: any = (data ?? []).find((s) => s.key === editingKey) ?? {};
      const labels = String(form.states).split(',').map((s) => s.trim()).filter(Boolean);
      // Send only the fields the form owns. Pricing is merged onto the original so custom fees/tax
      // aren't wiped, and bookingForm is left untouched (not edited here).
      return api.patch(`/service-types/${editingKey}`, {
        label: form.label.trim(),
        icon: form.icon.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        description: form.description.trim() || undefined,
        kind: form.kind,
        capabilities: {
          needsScheduling: form.needsScheduling, instantBooking: form.instantBooking,
          needsWorker: form.needsWorker, needsInventory: form.needsInventory,
          needsPickupDelivery: form.needsPickupDelivery, needsServiceArea: form.needsServiceArea,
        },
        workflow: buildWorkflow(labels),
        pricing: { ...(original.pricing ?? {}), strategy: form.strategy, commissionPercent: Number(form.commissionPercent) || 0 },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-types'] });
      closeForm();
    },
  });

  const saving = create.isPending || update.isPending;
  const saveError = (editingKey ? update.error : create.error) as Error | null;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Service Management</h2>
        <Button onClick={() => (showForm ? closeForm() : startCreate())}>{showForm ? 'Cancel' : '+ New service type'}</Button>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 20px' }}>
        Add a new service (car-wash, plumber, grocery, anything) and it appears in the apps instantly — no rewrite.
      </p>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>
            {editingKey ? `Edit "${form.label || editingKey}"` : 'New service type'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <Input label="Name" value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="e.g. Pest Control" />
            <Input
              label={editingKey ? 'Key (locked)' : 'Key (auto if blank)'}
              value={form.key}
              onChange={(e) => set('key', e.target.value)}
              placeholder={slug(form.label) || 'pest-control'}
              disabled={!!editingKey}
            />
            <Input label="Icon (fallback only)" value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="sparkles" />
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Kind</label>
              <select value={form.kind} onChange={(e) => set('kind', e.target.value)} style={selectStyle}>
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Pricing</label>
              <select value={form.strategy} onChange={(e) => set('strategy', e.target.value)} style={selectStyle}>
                {STRATEGIES.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <Input label="Commission %" type="number" value={form.commissionPercent} onChange={(e) => set('commissionPercent', e.target.value)} />
          </div>

          <ImageUploadField
            label="Service image (shown on the customer app cards)"
            value={form.imageUrl}
            onChange={(url) => set('imageUrl', url)}
          />

          <Input label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />

          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, margin: '6px 0' }}>
            Workflow stages (comma-separated, in order)
          </label>
          <Input value={form.states} onChange={(e) => set('states', e.target.value)} />
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            A linear flow with a Cancel option is generated automatically.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '4px 0 12px' }}>
            {CAPS.map((c) => (
              <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={!!form[c.key]} onChange={(e) => set(c.key, e.target.checked)} />
                {c.label}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              onClick={() => (editingKey ? update.mutate() : create.mutate())}
              loading={saving}
              disabled={form.label.trim().length < 2}
            >
              {editingKey ? 'Save changes' : 'Create service type'}
            </Button>
            <Button variant="outline" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
          </div>
          {saveError && (
            <div role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>
              {saveError.message}
            </div>
          )}
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {(data ?? []).map((s) => {
          const caps = Object.entries(s.capabilities ?? {}).filter(([, v]) => v).map(([k]) => k);
          const active = s.isActive !== false;
          return (
            <Card key={s.key} style={{ opacity: active ? 1 : 0.6 }}>
              {s.imageUrl ? (
                <img
                  src={s.imageUrl}
                  alt={s.label}
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 12, border: '1px solid var(--border)' }}
                />
              ) : (
                <div
                  aria-hidden
                  style={{ width: '100%', height: 140, borderRadius: 10, marginBottom: 12, background: 'var(--bg)', border: '1px dashed var(--border)', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 12 }}
                >
                  No image — upload one to show it in the app
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.label}
                    {!active && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', background: 'rgba(220,38,38,0.1)', padding: '2px 8px', borderRadius: 999 }}>
                        Disabled
                      </span>
                    )}
                  </h3>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    {s.key} · {s.kind}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: 999 }}>
                  {s.pricing?.strategy}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {caps.map((c) => (
                  <span key={c} style={{ fontSize: 11, color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 6px' }}>
                    {c.replace('needs', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
                {s.workflow?.states?.length ?? 0} workflow states · {s.bookingForm?.fields?.length ?? 0} form fields
                {s.pricing?.commissionPercent != null ? ` · ${s.pricing.commissionPercent}% commission` : ''}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <Button onClick={() => startEdit(s)} style={{ fontSize: 12 }}>
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setOpen(open === s.key ? null : s.key)} style={{ fontSize: 12 }}>
                  {open === s.key ? 'Hide workflow' : 'View workflow'}
                </Button>
                {active ? (
                  <Button
                    variant="danger"
                    loading={disable.isPending && disable.variables === s.key}
                    onClick={() => confirm(`Disable "${s.label}"? It will be hidden from the apps.`) && disable.mutate(s.key)}
                    style={{ fontSize: 12 }}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    loading={enable.isPending && enable.variables === s.key}
                    onClick={() => enable.mutate(s.key)}
                    style={{ fontSize: 12 }}
                  >
                    Enable
                  </Button>
                )}
              </div>

              {open === s.key && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(s.workflow?.states ?? []).map((st) => (
                    <span key={st.key} style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 7px' }}>
                      {st.label}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
        {!data?.length && <div style={{ color: 'var(--muted)' }}>No service types</div>}
      </div>
    </section>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 15, background: 'var(--surface)',
};

/** Upload a real image (Cloudinary) and store the returned URL on the form. */
function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handlePick = async (file?: File) => {
    if (!file) return;
    setErr('');
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (e: any) {
      setErr(e?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {value ? (
          <img
            src={value}
            alt="preview"
            style={{ width: 96, height: 72, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }}
          />
        ) : (
          <div
            aria-hidden
            style={{ width: 96, height: 72, borderRadius: 10, background: 'var(--bg)', border: '1px dashed var(--border)', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 11 }}
          >
            No image
          </div>
        )}
        <label
          style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: uploading ? 'wait' : 'pointer', fontWeight: 600, fontSize: 13 }}
        >
          {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => handlePick(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 12 }}
          >
            Remove
          </button>
        )}
      </div>
      {err && (
        <div role="alert" style={{ color: 'var(--danger)', marginTop: 6, fontSize: 12 }}>
          {err}
        </div>
      )}
    </div>
  );
}
