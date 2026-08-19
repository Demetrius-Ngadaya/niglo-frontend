'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

type Equipment = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_path?: string | null;
  price_per_day?: string | null;
  quantity_available: number;
  is_active: boolean;
  category?: { id: number; name: string } | null;
};

const emptyDraft = {
  category: '',
  name: '',
  description: '',
  image_path: '',
  price_per_day: '',
  quantity_available: 1,
  is_active: true,
};

export default function AdminRentalsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    adminFetch('/admin/rental-equipment')
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    items.forEach((item) => {
      if (item.category?.name) names.add(item.category.name);
    });
    return Array.from(names);
  }, [items]);

  function startAdd() {
    setDraft(emptyDraft);
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(item: Equipment) {
    setDraft({
      category: item.category?.name || '',
      name: item.name,
      description: item.description || '',
      image_path: item.image_path || '',
      price_per_day: item.price_per_day || '',
      quantity_available: item.quantity_available,
      is_active: item.is_active,
    });
    setEditingId(item.id);
    setAdding(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'rental-equipment');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, image_path: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft.name.trim()) {
      alert('Please enter an equipment name.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminFetch(`/admin/rental-equipment/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(draft),
        });
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await adminFetch('/admin/rental-equipment', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
        setItems((prev) => [created, ...prev]);
      }
      setAdding(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save equipment.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this equipment listing?')) return;
    try {
      await adminFetch(`/admin/rental-equipment/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  // Group by category name for a cleaner list, "Uncategorized" last.
  const grouped = useMemo(() => {
    const map = new Map<string, Equipment[]>();
    items.forEach((item) => {
      const key = item.category?.name || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a === 'Uncategorized' ? 1 : a.localeCompare(b)));
  }, [items]);

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Admin</div>
            <h1 className="font-display text-3xl">Rental Equipment</h1>
          </div>
          <button onClick={startAdd} className="btn-primary text-sm">
            + Add Equipment
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <p className="text-ink/50 text-sm">Loading…</p>}

        {adding && (
          <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
            <div className="eyebrow mb-4">{editingId ? 'Edit Equipment' : 'New Equipment'}</div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Equipment name (e.g. Canon EOS R6)"
                className="border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <div>
                <input
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  placeholder="Category (e.g. Photo & Video Equipment)"
                  list="rental-categories"
                  className="w-full border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
                />
                <datalist id="rental-categories">
                  {categoryNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <input
                value={draft.price_per_day}
                onChange={(e) => setDraft((d) => ({ ...d, price_per_day: e.target.value }))}
                placeholder="Price per day (e.g. 50,000 TZS)"
                className="border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                type="number"
                min={0}
                value={draft.quantity_available}
                onChange={(e) => setDraft((d) => ({ ...d, quantity_available: Number(e.target.value) }))}
                placeholder="Quantity available"
                className="border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
              />
            </div>

            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Description"
              rows={3}
              className="w-full border border-ink/15 px-3 py-2 bg-white text-sm focus-ring mb-4"
            />

            <div className="flex items-center gap-3 mb-4">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
              {uploading && <span className="text-xs text-ink/50">Uploading…</span>}
              {draft.image_path && (
                <img src={imageUrl(draft.image_path)!} alt="" className="w-14 h-14 object-cover border border-ink/10" />
              )}
            </div>

            <label className="flex items-center gap-2 text-sm mb-4">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
                className="accent-brass w-4 h-4"
              />
              Active (visible on site)
            </label>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Equipment'}
              </button>
              <button onClick={() => setAdding(false)} className="btn-outline text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {grouped.map(([categoryName, categoryItems]) => (
            <div key={categoryName}>
              <h2 className="font-display text-lg mb-3">{categoryName}</h2>
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border border-ink/10 bg-white/40 p-3">
                    {item.image_path && (
                      <img src={imageUrl(item.image_path)!} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-ink/40">
                        {item.price_per_day ? `${item.price_per_day} / day` : 'No price set'} &middot; Qty: {item.quantity_available}
                      </div>
                    </div>
                    {!item.is_active && <span className="text-xs bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full">Inactive</span>}
                    <button onClick={() => startEdit(item)} className="text-sm hover:text-brass">Edit</button>
                    <button onClick={() => remove(item.id)} className="text-sm text-red-700 hover:underline">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <p className="text-ink/50 text-sm">No equipment yet — add some to get started.</p>
          )}
        </div>
      </div>
    </>
  );
}
