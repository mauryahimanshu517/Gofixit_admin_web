import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { Card, Button, Input } from '@/core/components/ui';

type Section = { key: string; type: string; title?: string; enabled: boolean; order: number; config?: any };

/**
 * Homepage Management (req. #10) — reorder sections, enable/disable, retitle, set limits, and
 * add/remove sections. The customer app renders exactly this configuration, so changes here
 * reshape the app home with no deploy.
 */
export default function HomepagePage() {
  const qc = useQueryClient();
  const { data: config } = useQuery({
    queryKey: ['admin-homepage'],
    queryFn: async () => (await api.get('/admin/homepage')).data.data,
  });
  const { data: types } = useQuery<string[]>({
    queryKey: ['homepage-section-types'],
    queryFn: async () => (await api.get('/admin/homepage/section-types')).data.data,
  });

  const [sections, setSections] = useState<Section[]>([]);
  const [newType, setNewType] = useState('');

  useEffect(() => {
    if (config?.sections) setSections(config.sections);
  }, [config]);

  const save = useMutation({
    mutationFn: () => api.put('/admin/homepage', { sections }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-homepage'] }),
  });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };
  const patch = (i: number, p: Partial<Section>) =>
    setSections((s) => s.map((x, idx) => (idx === i ? { ...x, ...p } : x)));
  const remove = (i: number) => setSections((s) => s.filter((_, idx) => idx !== i));
  const add = () => {
    if (!newType) return;
    setSections((s) => [
      ...s,
      { key: `${newType}-${Date.now().toString(36)}`, type: newType, title: '', enabled: true, order: s.length, config: { limit: 10 } },
    ]);
    setNewType('');
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Homepage Layout</h2>
        <Button onClick={() => save.mutate()} loading={save.isPending}>Save layout</Button>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 20px' }}>
        Reorder, toggle and configure the sections customers see. The app renders this exactly.
      </p>

      {sections.map((s, i) => (
        <Card key={s.key} style={{ marginBottom: 12, opacity: s.enabled ? 1 : 0.55 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => move(i, -1)} disabled={i === 0} style={arrowBtn}>▲</button>
              <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} style={arrowBtn}>▼</button>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.type}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Input
                    placeholder="Section title (shown in app)"
                    value={s.title ?? ''}
                    onChange={(e) => patch(i, { title: e.target.value })}
                  />
                </div>
                <input
                  type="number"
                  placeholder="limit"
                  value={s.config?.limit ?? ''}
                  onChange={(e) => patch(i, { config: { ...s.config, limit: Number(e.target.value) || undefined } })}
                  style={{ width: 80, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10 }}
                />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={s.enabled} onChange={(e) => patch(i, { enabled: e.target.checked })} />
              Enabled
            </label>
            <Button variant="danger" onClick={() => remove(i)} style={{ fontSize: 12, padding: '6px 10px', minHeight: 30 }}>
              Remove
            </Button>
          </div>
        </Card>
      ))}

      <Card style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}>
            <option value="">Add a section…</option>
            {(types ?? []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <Button onClick={add} disabled={!newType}>Add section</Button>
        </div>
      </Card>
    </section>
  );
}

const arrowBtn: React.CSSProperties = {
  border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 6, width: 26, height: 22, cursor: 'pointer', fontSize: 10,
};
