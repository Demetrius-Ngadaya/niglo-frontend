'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';

type Testimonial = {
  id: number;
  client_name: string;
  photo_path?: string | null;
  service_category?: string | null;
  story: string;
  rating: number;
  featured: boolean;
  is_published: boolean;
};

const emptyDraft = { client_name: '', photo_path: '', service_category: '', story: '', rating: 5, featured: false, is_published: true };

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Testimonial[]>([]);
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
    adminFetch('/admin/testimonials')
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function startAdd() {
    setDraft(emptyDraft);
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(t: Testimonial) {
    setDraft({
      client_name: t.client_name,
      photo_path: t.photo_path || '',
      service_category: t.service_category || '',
      story: t.story,
      rating: t.rating,
      featured: t.featured,
      is_published: t.is_published,
    });
    setEditingId(t.id);
    setAdding(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'testimonials');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, photo_path: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft.client_name.trim() || !draft.story.trim()) {
      alert('Please enter a client name and their story.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminFetch(`/admin/testimonials/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(draft),
        });
        setItems((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await adminFetch('/admin/testimonials', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
        setItems((prev) => [created, ...prev]);
      }
      setAdding(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save testimonial.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this testimonial?')) return;
    try {
      await adminFetch(`/admin/testimonials/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Admin</div>
            <h1 className="font-display text-3xl">Testimonials</h1>
          </div>
          <button onClick={startAdd} className="btn-primary text-sm">
            + Add Testimonial
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <p className="text-ink/50 dark:text-stone/60 text-sm">Loading…</p>}

        {adding && (
          <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
            <div className="eyebrow mb-4">{editingId ? 'Edit Testimonial' : 'New Testimonial'}</div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={draft.client_name}
                onChange={(e) => setDraft((d) => ({ ...d, client_name: e.target.value }))}
                placeholder="Client name"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                value={draft.service_category}
                onChange={(e) => setDraft((d) => ({ ...d, service_category: e.target.value }))}
                placeholder="Service (e.g. Interior Design)"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
            </div>

            <textarea
              value={draft.story}
              onChange={(e) => setDraft((d) => ({ ...d, story: e.target.value }))}
              placeholder="Their story / testimonial"
              rows={4}
              className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring mb-4"
            />

            <div className="flex items-center gap-3 mb-4">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm" />
              {uploading && <span className="text-xs text-ink/50 dark:text-stone/60">Uploading…</span>}
              {draft.photo_path && (
                <img src={imageUrl(draft.photo_path)!} alt="" className="w-12 h-12 rounded-full object-cover border border-ink/10 dark:border-stone/10" />
              )}
            </div>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-ink/60 dark:text-stone/60">Rating</label>
                <select
                  value={draft.rating}
                  onChange={(e) => setDraft((d) => ({ ...d, rating: Number(e.target.value) }))}
                  className="border border-ink/15 dark:border-stone/15 px-2 py-1 bg-white text-sm focus-ring"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                  className="accent-brass w-4 h-4"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_published}
                  onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))}
                  className="accent-brass w-4 h-4"
                />
                Published
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Testimonial'}
              </button>
              <button onClick={() => setAdding(false)} className="btn-outline text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="flex items-start gap-4 border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-4">
              {t.photo_path ? (
                <img src={imageUrl(t.photo_path)!} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-stoneDark dark:bg-white/5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {t.client_name} <span className="text-brass">{'★'.repeat(t.rating)}</span>
                </div>
                <div className="text-xs text-ink/40 dark:text-stone/50 mb-1">{t.service_category || 'General'}</div>
                <p className="text-sm text-ink/70 dark:text-stone/70 line-clamp-2">{t.story}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex gap-1">
                  {t.featured && <span className="text-xs bg-brass/20 text-brass px-2 py-0.5 rounded-full">Featured</span>}
                  {!t.is_published && <span className="text-xs bg-ink/10 text-ink/50 dark:text-stone/60 px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(t)} className="text-xs hover:text-brass">Edit</button>
                  <button onClick={() => remove(t.id)} className="text-xs text-red-700 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <p className="text-ink/50 dark:text-stone/60 text-sm">No testimonials yet — add one to get started.</p>
          )}
        </div>
      </div>

  );
}
