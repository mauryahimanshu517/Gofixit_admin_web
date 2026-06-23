import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/core/api/client';
import { uploadImage } from '@/core/api/uploads';
import { Card, Button, Input } from '@/core/components/ui';

type CreateField = { key: string; label: string; type?: string; options?: string[] };

function ImageUploadField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handlePick = async (file?: File) => {
    if (!file) return;
    setErr('');
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (e: any) {
      setErr(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {value ? (
          <img
            src={value}
            alt="preview"
            style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }}
          />
        ) : (
          <div
            aria-hidden
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: 'var(--bg)',
              border: '1px dashed var(--border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--muted)',
              fontSize: 10,
            }}
          >
            No image
          </div>
        )}
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            cursor: uploading ? 'wait' : 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {uploading ? 'Uploading…' : value ? 'Replace' : 'Choose file'}
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
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              fontSize: 12,
            }}
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

/* ── Generic CRUD list with inline create form ── */
function SimpleList({
  title,
  endpoint,
  fields,
  createFields,
}: {
  title: string;
  endpoint: string;
  fields: string[];
  createFields?: CreateField[];
}) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => (await api.get(endpoint)).data.data,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, any>) => {
      await api.post(endpoint, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setForm({});
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeleting(id);
      await api.delete(`${endpoint}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setDeleting(null);
    },
    onError: () => setDeleting(null),
  });

  const handleCreate = () => {
    const body: Record<string, any> = {};
    for (const f of createFields ?? []) {
      const val = form[f.key]?.trim();
      if (!val) continue;
      if (f.type === 'number') body[f.key] = Number(val);
      else if (f.type === 'boolean') body[f.key] = val === 'true';
      else body[f.key] = val;
    }
    createMutation.mutate(body);
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{title}</h2>
        {createFields && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : `+ Add ${title.slice(0, -1)}`}
          </Button>
        )}
      </div>

      {showForm && createFields && (
        <Card style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {createFields.map((f) =>
              f.type === 'file' ? (
                <ImageUploadField
                  key={f.key}
                  label={f.label}
                  value={form[f.key] ?? ''}
                  onChange={(url) => setForm({ ...form, [f.key]: url })}
                />
              ) : f.options ? (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <select
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      fontSize: 15,
                      background: 'var(--surface)',
                    }}
                  >
                    <option value="">Select...</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  key={f.key}
                  label={f.label}
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={form[f.key] ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                />
              )
            )}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              Create
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setForm({}); }}>
              Cancel
            </Button>
          </div>
          {createMutation.isError && (
            <div role="alert" style={{ color: 'var(--danger)', marginTop: 8, fontSize: 13 }}>
              {(createMutation.error as Error).message}
            </div>
          )}
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ background: 'var(--primary-soft)', textAlign: 'left' }}>
            <tr>
              {fields.map((f) => (
                <th key={f} style={{ padding: 12, textTransform: 'capitalize' }}>
                  {f}
                </th>
              ))}
              <th style={{ padding: 12, width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row: any) => (
              <tr key={row._id} style={{ borderTop: '1px solid var(--border)' }}>
                {fields.map((f) => (
                  <td key={f} style={{ padding: 12 }}>
                    {String(row[f] ?? '—')}
                  </td>
                ))}
                <td style={{ padding: 12 }}>
                  <Button
                    variant="danger"
                    loading={deleting === row._id}
                    onClick={() => {
                      if (confirm(`Delete this ${title.slice(0, -1).toLowerCase()}?`)) {
                        deleteMutation.mutate(row._id);
                      }
                    }}
                    style={{ fontSize: 12, padding: '4px 10px', minHeight: 28 }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td
                  colSpan={fields.length + 1}
                  style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}
                >
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

/* ── Page exports ── */

const CATEGORY_GRID_STYLES = `
  .cat-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  .cat-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease, opacity 200ms ease;
    cursor: grab;
    user-select: none;
  }
  .cat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.10);
  }
  .cat-card.dragging {
    opacity: 0.4;
    cursor: grabbing;
  }
  .cat-card.drop-target {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
  }
  .cat-card-img-wrap {
    width: 100%;
    aspect-ratio: 4 / 3;
    background: var(--bg);
    overflow: hidden;
  }
  .cat-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cat-card-body {
    padding: 14px 16px 16px;
    text-align: center;
  }
  .cat-card-label {
    font-weight: 600;
    font-size: 15px;
    letter-spacing: 0.3px;
    margin: 0;
  }
  .cat-card-meta {
    color: var(--muted);
    font-size: 12px;
    margin-top: 4px;
    text-transform: capitalize;
  }
  .cat-card-delete {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.55);
    color: #fff;
    border: none;
    border-radius: 999px;
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    font-size: 16px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 200ms ease, background 200ms ease;
  }
  .cat-card:hover .cat-card-delete { opacity: 1; }
  .cat-card-delete:hover { background: var(--danger); }
  .cat-drag-handle {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.45);
    color: #fff;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    opacity: 0;
    transition: opacity 200ms ease;
    pointer-events: none;
  }
  .cat-card:hover .cat-drag-handle { opacity: 1; }
  .cat-placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--muted);
    font-size: 12px;
  }
`;

const CATEGORY_GENDER_OPTIONS = ['all', 'women', 'men', 'kids', 'unisex'];

type Gender = 'women' | 'men' | 'kids';

const SUBCAT_GENDERS: { key: Gender; title: string; accent: string }[] = [
  { key: 'women', title: 'Women Sub-Categories', accent: '#B2456F' },
  { key: 'men', title: 'Men Sub-Categories', accent: '#2D4A6F' },
  { key: 'kids', title: 'Kids Sub-Categories', accent: '#D4A24C' },
];

const SubCategorySection: React.FC<{ gender: Gender; title: string; accent: string }> = ({
  gender,
  title,
  accent,
}) => {
  const queryClient = useQueryClient();
  const endpoint = '/admin/subcategories';
  const qKey = [endpoint, gender];

  const { data } = useQuery({
    queryKey: qKey,
    queryFn: async () => (await api.get(`${endpoint}?gender=${gender}`)).data.data,
  });

  const sorted: any[] = useMemo(
    () => [...(data ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [data]
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, any>) => {
      await api.post(endpoint, { ...body, gender });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setForm({});
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      await api.delete(`${endpoint}/${id}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setDeletingId(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post(`${endpoint}/reorder`, { ids });
    },
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<any[]>(qKey);
      const idxMap = new Map(ids.map((id, i) => [id, i]));
      queryClient.setQueryData<any[]>(qKey, (old) =>
        (old ?? []).map((c: any) =>
          idxMap.has(c._id) ? { ...c, sortOrder: idxMap.get(c._id) } : c
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const handleCreate = () => {
    const body: Record<string, any> = {};
    if (form.label?.trim()) body.label = form.label.trim();
    if (form.key?.trim()) body.key = form.key.trim();
    if (form.image) body.image = form.image;
    if (!body.label) return;
    createMutation.mutate(body);
  };

  const handleDrop = (targetId: string) => {
    const source = dragId;
    setDragId(null);
    setOverId(null);
    if (!source || source === targetId) return;
    const ids = sorted.map((c) => c._id);
    const from = ids.indexOf(source);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    reorderMutation.mutate(ids);
  };

  return (
    <section style={{ marginTop: 40 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          borderLeft: `4px solid ${accent}`,
          paddingLeft: 12,
        }}
      >
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h3>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '2px 0 0' }}>
            Upload images here to show them in the {gender} page of the customer app.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : `+ Add ${gender}`}
        </Button>
      </div>

      {showForm && (
        <Card style={{ margin: '16px 0 20px', padding: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <Input
              label="Title (shown below card)"
              value={form.label ?? ''}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <Input
              label="Key (optional — auto-generated from title)"
              value={form.key ?? ''}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
            <ImageUploadField
              label="Image"
              value={form.image ?? ''}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              Create
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setForm({});
              }}
            >
              Cancel
            </Button>
          </div>
          {createMutation.isError && (
            <div role="alert" style={{ color: 'var(--danger)', marginTop: 8, fontSize: 13 }}>
              {(createMutation.error as Error).message}
            </div>
          )}
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
          No {gender} sub-categories yet. Click “+ Add {gender}” to upload your first one.
        </Card>
      ) : (
        <div className="cat-grid">
          {sorted.map((c: any) => {
            const isDragging = dragId === c._id;
            const isOver = overId === c._id && dragId && dragId !== c._id;
            return (
              <article
                key={c._id}
                className={`cat-card${isDragging ? ' dragging' : ''}${isOver ? ' drop-target' : ''}`}
                draggable
                onDragStart={(e) => {
                  setDragId(c._id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', c._id);
                }}
                onDragOver={(e) => {
                  if (!dragId || dragId === c._id) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (overId !== c._id) setOverId(c._id);
                }}
                onDragLeave={() => {
                  if (overId === c._id) setOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(c._id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                aria-label={`${c.label} sub-category`}
              >
                <span className="cat-drag-handle">⋮⋮ DRAG</span>
                <button
                  type="button"
                  className="cat-card-delete"
                  aria-label={`Delete ${c.label}`}
                  disabled={deletingId === c._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete sub-category “${c.label}”?`)) {
                      deleteMutation.mutate(c._id);
                    }
                  }}
                >
                  {deletingId === c._id ? '…' : '×'}
                </button>
                <div className="cat-card-img-wrap">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={`${c.label} sub-category`}
                      className="cat-card-img"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <div className="cat-placeholder">No image</div>
                  )}
                </div>
                <div className="cat-card-body">
                  <p className="cat-card-label">{c.label}</p>
                  <div className="cat-card-meta">
                    {gender}
                    {typeof c.sortOrder === 'number' ? ` · #${c.sortOrder}` : ''}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const endpoint = '/admin/categories';

  const { data } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => (await api.get(endpoint)).data.data,
  });

  const sortedCats: any[] = useMemo(
    () => [...(data ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [data]
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, any>) => {
      await api.post(endpoint, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setForm({});
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      await api.delete(`${endpoint}/${id}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setDeletingId(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post(`${endpoint}/reorder`, { ids });
    },
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: [endpoint] });
      const prev = queryClient.getQueryData<any[]>([endpoint]);
      const idxMap = new Map(ids.map((id, i) => [id, i]));
      queryClient.setQueryData<any[]>([endpoint], (old) =>
        (old ?? []).map((c: any) =>
          idxMap.has(c._id) ? { ...c, sortOrder: idxMap.get(c._id) } : c
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData([endpoint], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  });

  const handleCreate = () => {
    const body: Record<string, any> = {};
    if (form.key?.trim()) body.key = form.key.trim();
    if (form.label?.trim()) body.label = form.label.trim();
    if (form.gender) body.gender = form.gender;
    if (form.sortOrder?.trim()) body.sortOrder = Number(form.sortOrder);
    if (form.image) body.image = form.image;
    createMutation.mutate(body);
  };

  const handleDrop = (targetId: string) => {
    const source = dragId;
    setDragId(null);
    setOverId(null);
    if (!source || source === targetId) return;
    const ids = sortedCats.map((c) => c._id);
    const from = ids.indexOf(source);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    reorderMutation.mutate(ids);
  };

  return (
    <section>
      <style>{CATEGORY_GRID_STYLES}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Categories</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Category'}
        </Button>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 20px' }}>
        Drag and drop a card to change the order shown in the app.
      </p>

      {showForm && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <Input
              label="Key"
              value={form.key ?? ''}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
            <Input
              label="Label"
              value={form.label ?? ''}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Gender
              </label>
              <select
                value={form.gender ?? ''}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 15,
                  background: 'var(--surface)',
                }}
              >
                <option value="">Select...</option>
                {CATEGORY_GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g === 'all' ? 'All (shows every tailor)' : g}
                  </option>
                ))}
              </select>
            </div>
            <ImageUploadField
              label="Image"
              value={form.image ?? ''}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Button onClick={handleCreate} loading={createMutation.isPending}>
              Create
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setForm({});
              }}
            >
              Cancel
            </Button>
          </div>
          {createMutation.isError && (
            <div role="alert" style={{ color: 'var(--danger)', marginTop: 8, fontSize: 13 }}>
              {(createMutation.error as Error).message}
            </div>
          )}
        </Card>
      )}

      {sortedCats.length === 0 ? (
        <Card style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
          No categories yet. Click “Add Category” to create your first one.
        </Card>
      ) : null}
      {sortedCats.length > 0 && (
        <div className="cat-grid">
          {sortedCats.map((c: any) => {
            const isDragging = dragId === c._id;
            const isOver = overId === c._id && dragId && dragId !== c._id;
            return (
              <article
                key={c._id}
                className={`cat-card${isDragging ? ' dragging' : ''}${isOver ? ' drop-target' : ''}`}
                draggable
                onDragStart={(e) => {
                  setDragId(c._id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', c._id);
                }}
                onDragOver={(e) => {
                  if (!dragId || dragId === c._id) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (overId !== c._id) setOverId(c._id);
                }}
                onDragLeave={() => {
                  if (overId === c._id) setOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(c._id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                aria-label={`${c.label} category`}
              >
                <span className="cat-drag-handle">⋮⋮ DRAG</span>
                <button
                  type="button"
                  className="cat-card-delete"
                  aria-label={`Delete ${c.label}`}
                  disabled={deletingId === c._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete category “${c.label}”?`)) {
                      deleteMutation.mutate(c._id);
                    }
                  }}
                >
                  {deletingId === c._id ? '…' : '×'}
                </button>
                <div className="cat-card-img-wrap">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={`${c.label} category`}
                      className="cat-card-img"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <div className="cat-placeholder">No image</div>
                  )}
                </div>
                <div className="cat-card-body">
                  <p className="cat-card-label">{c.label}</p>
                  <div className="cat-card-meta">
                    {c.gender ?? '—'}
                    {typeof c.sortOrder === 'number' ? ` · #${c.sortOrder}` : ''}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Sub-categories — one section per gender */}
      {SUBCAT_GENDERS.map((g) => (
        <SubCategorySection key={g.key} gender={g.key} title={g.title} accent={g.accent} />
      ))}
    </section>
  );
};

export const CouponsPage = () => (
  <SimpleList
    title="Coupons"
    endpoint="/admin/coupons"
    fields={['code', 'type', 'value', 'minOrder', 'maxDiscount', 'audience', 'isActive']}
    createFields={[
      { key: 'code', label: 'Code' },
      { key: 'type', label: 'Type', options: ['flat', 'percent'] },
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'minOrder', label: 'Min order', type: 'number' },
      { key: 'maxDiscount', label: 'Max discount', type: 'number' },
      { key: 'audience', label: 'Audience', options: ['all', 'new', 'returning'] },
    ]}
  />
);

export const BannersPage = () => (
  <SimpleList
    title="Banners"
    endpoint="/admin/banners"
    fields={['title', 'subtitle', 'position', 'active']}
    createFields={[
      { key: 'title', label: 'Title' },
      { key: 'subtitle', label: 'Subtitle' },
      { key: 'image', label: 'Image', type: 'file' },
      { key: 'ctaUrl', label: 'CTA URL' },
      { key: 'position', label: 'Position', options: ['home_top', 'home_mid', 'category'] },
    ]}
  />
);

