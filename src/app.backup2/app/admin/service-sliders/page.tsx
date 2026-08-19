'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';

type Slide = {
  id: number;
  image_path: string;
  title?: string | null;
  display_order: number;
  is_active: boolean;
};

const emptyDraft = { image_path: '', title: '', display_order: 0, is_active: true };

export default function AdminServiceSlidersPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    adminFetch('/admin/service-sliders')
      .then(setSlides)
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

  function startEdit(slide: Slide) {
    setDraft({
      image_path: slide.image_path,
      title: slide.title || '',
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
    setEditingId(slide.id);
    setAdding(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'service-sliders');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, image_path: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft.image_path) {
      alert('Please upload an image first.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminFetch(`/admin/service-sliders/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(draft),
        });
        setSlides((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await adminFetch('/admin/service-sliders', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
        setSlides((prev) => [...prev, created]);
      }
      setAdding(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save slide.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this slide?')) return;
    try {
      await adminFetch(`/admin/service-sliders/${id}`, { method: 'DELETE' });
      setSlides((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Admin</div>
            <h1 className="font-display text-3xl">Service Sliders</h1>
            <p className="text-sm text-ink/50 dark:text-stone/60 mt-2 max-w-lg">
              These are the sliding images shown at the top of the public Services page,
              before &quot;Our Services&quot; — separate from individual service photos.
              Use large, clear images; they display uncropped.
            </p>
          </div>
          <button onClick={startAdd} className="btn-primary text-sm">
            + Add Slide
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <p className="text-ink/50 dark:text-stone/60 text-sm">Loading…</p>}

        {adding && (
          <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
            <div className="eyebrow mb-4">{editingId ? 'Edit Slide' : 'New Slide'}</div>

            <div className="flex items-center gap-4 mb-4">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
              {uploading && <span className="text-xs text-ink/50 dark:text-stone/60">Uploading…</span>}
            </div>
            {draft.image_path && (
              <div className="mb-4 bg-ink w-full max-w-md h-40 flex items-center justify-center overflow-hidden">
                <img src={imageUrl(draft.image_path)!} alt="" className="max-w-full max-h-full object-contain" />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Title (optional)"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                type="number"
                value={draft.display_order}
                onChange={(e) => setDraft((d) => ({ ...d, display_order: Number(e.target.value) }))}
                placeholder="Display order"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
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
                {saving ? 'Saving…' : 'Save Slide'}
              </button>
              <button onClick={() => setAdding(false)} className="btn-outline text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {slides.map((slide) => (
            <div key={slide.id} className="flex items-center gap-4 border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-3">
              <div className="w-24 h-16 bg-ink flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={imageUrl(slide.image_path)!} alt="" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{slide.title || <span className="text-ink/40 dark:text-stone/50">No title</span>}</div>
                <div className="text-xs text-ink/40 dark:text-stone/50">Order {slide.display_order}</div>
              </div>
              {!slide.is_active && <span className="text-xs bg-ink/10 text-ink/50 dark:text-stone/60 px-2 py-0.5 rounded-full">Inactive</span>}
              <button onClick={() => startEdit(slide)} className="text-sm hover:text-brass">Edit</button>
              <button onClick={() => remove(slide.id)} className="text-sm text-red-700 hover:underline">Delete</button>
            </div>
          ))}
          {!loading && slides.length === 0 && (
            <p className="text-ink/50 dark:text-stone/60 text-sm">No slides yet — add one to get started.</p>
          )}
        </div>
      </div>

  );
}
