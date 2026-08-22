'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';
import { AdminListSkeleton } from '@/components/AdminSkeleton';

type Slide = {
  id: number;
  title: string;
  slug: string;
  image_path: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
};

const emptyDraft = { title: '', description: '', image_path: '', display_order: 0, is_active: true };

export default function AdminHeroSlidesPage() {
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
    adminFetch('/admin/hero-slides')
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
      title: slide.title,
      description: slide.description || '',
      image_path: slide.image_path,
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
      form.append('folder', 'hero-slides');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, image_path: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft.title.trim()) {
      alert('Please enter a title.');
      return;
    }
    if (!draft.image_path) {
      alert('Please upload an image first.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminFetch(`/admin/hero-slides/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(draft),
        });
        setSlides((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await adminFetch('/admin/hero-slides', {
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
      await adminFetch(`/admin/hero-slides/${id}`, { method: 'DELETE' });
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
          <h1 className="font-display text-3xl">Homepage Hero Slides</h1>
          <p className="text-sm text-ink/50 dark:text-stone/50 mt-2 max-w-lg">
            These are the crossfading images at the very top of the homepage. Each one has a
            title and description, shown to visitors when they click &quot;View Details.&quot;
            Use large, clear images — they display uncropped.
          </p>
        </div>
        <button onClick={startAdd} className="btn-primary text-sm">
          + Add Slide
        </button>
      </div>

      {error && <p className="text-red-700 dark:text-red-400 text-sm mb-6">{error}</p>}
      {loading && <AdminListSkeleton />}

      {adding && (
        <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
          <div className="eyebrow mb-4">{editingId ? 'Edit Slide' : 'New Slide'}</div>

          <div className="flex items-center gap-4 mb-4">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            {uploading && <span className="text-xs text-ink/50 dark:text-stone/50">Uploading…</span>}
          </div>
          {draft.image_path && (
            <div className="mb-4 w-full max-w-md h-48 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(draft.image_path)!} alt="" className="max-w-full max-h-full object-contain" />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Title"
              className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring"
            />
            <input
              type="number"
              value={draft.display_order}
              onChange={(e) => setDraft((d) => ({ ...d, display_order: Number(e.target.value) }))}
              placeholder="Display order"
              className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring"
            />
          </div>

          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Description — shown on the highlight detail page"
            rows={4}
            className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring mb-4"
          />

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
            <div className="w-28 h-20 bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(slide.image_path)!} alt="" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{slide.title}</div>
              <div className="text-xs text-ink/40 dark:text-stone/40">Order {slide.display_order}</div>
            </div>
            {!slide.is_active && <span className="text-xs bg-ink/10 dark:bg-stone/10 text-ink/50 dark:text-stone/50 px-2 py-0.5 rounded-full">Inactive</span>}
            <button onClick={() => startEdit(slide)} className="text-sm hover:text-brass">Edit</button>
            <button onClick={() => remove(slide.id)} className="text-sm text-red-700 dark:text-red-400 hover:underline">Delete</button>
          </div>
        ))}
        {!loading && slides.length === 0 && (
          <p className="text-ink/50 dark:text-stone/50 text-sm">No slides yet — add one to get started.</p>
        )}
      </div>
    </div>
  );
}
