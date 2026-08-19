'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';

type ProjectImage = { id: number; image_path: string; caption?: string | null };

type Project = {
  id: number;
  service_category_id?: number | null;
  title: string;
  slug: string;
  client_name?: string | null;
  location?: string | null;
  completed_on?: string | null;
  summary?: string | null;
  description?: string | null;
  cover_image_path?: string | null;
  before_image_path?: string | null;
  after_image_path?: string | null;
  featured: boolean;
  status: 'draft' | 'published';
  display_order: number;
  images?: ProjectImage[];
};

type Category = { id: number; name: string };

const emptyDraft = {
  service_category_id: '',
  title: '',
  client_name: '',
  location: '',
  completed_on: '',
  summary: '',
  description: '',
  cover_image_path: '',
  before_image_path: '',
  after_image_path: '',
  featured: false,
  status: 'published' as 'draft' | 'published',
  display_order: 0,
};

export default function AdminPortfolioPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    Promise.all([adminFetch('/admin/portfolio-projects'), adminFetch('/admin/service-categories')])
      .then(([proj, cats]) => {
        setProjects(proj);
        setCategories(cats);
      })
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

  function startEdit(p: Project) {
    setDraft({
      service_category_id: p.service_category_id ? String(p.service_category_id) : '',
      title: p.title,
      client_name: p.client_name || '',
      location: p.location || '',
      completed_on: p.completed_on ? p.completed_on.slice(0, 10) : '',
      summary: p.summary || '',
      description: p.description || '',
      cover_image_path: p.cover_image_path || '',
      before_image_path: p.before_image_path || '',
      after_image_path: p.after_image_path || '',
      featured: p.featured,
      status: p.status,
      display_order: p.display_order,
    });
    setEditingId(p.id);
    setAdding(true);
  }

  async function uploadTo(field: 'cover_image_path' | 'before_image_path' | 'after_image_path', file: File) {
    setUploadingField(field);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'portfolio');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, [field]: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingField(null);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingId) return;
    setUploadingGallery(true);
    const failed: string[] = [];
    try {
      for (const file of Array.from(files)) {
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('folder', 'portfolio');
          const uploaded = await adminFetch('/admin/upload', { method: 'POST', body: form });
          const image = await adminFetch(`/admin/portfolio-projects/${editingId}/images`, {
            method: 'POST',
            body: JSON.stringify({ image_path: uploaded.path }),
          });
          setProjects((prev) =>
            prev.map((p) => (p.id === editingId ? { ...p, images: [...(p.images || []), image] } : p))
          );
        } catch (err) {
          // Keep going — one oversized or invalid file shouldn't stop the rest of the batch.
          failed.push(`${file.name} (${err instanceof Error ? err.message : 'upload failed'})`);
        }
      }
      if (failed.length > 0) {
        alert(`${failed.length} photo(s) could not be uploaded:\n\n${failed.join('\n')}\n\nEverything else in the batch uploaded successfully. Large photos (over 25MB) are the most common cause — try resizing and re-uploading those.`);
      }
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  }

  async function deleteGalleryImage(imageId: number) {
    if (!editingId) return;
    if (!confirm('Remove this photo?')) return;
    try {
      await adminFetch(`/admin/portfolio-projects/${editingId}/images/${imageId}`, { method: 'DELETE' });
      setProjects((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, images: (p.images || []).filter((i) => i.id !== imageId) } : p))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove photo.');
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...draft,
        service_category_id: draft.service_category_id || null,
        completed_on: draft.completed_on || null,
      };
      if (editingId) {
        const updated = await adminFetch(`/admin/portfolio-projects/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await adminFetch('/admin/portfolio-projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setProjects((prev) => [...prev, created]);
        setEditingId(created.id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await adminFetch(`/admin/portfolio-projects/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) setAdding(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  function ImageSlot({ label, field }: { label: string; field: 'cover_image_path' | 'before_image_path' | 'after_image_path' }) {
    return (
      <div>
        <div className="text-xs text-ink/50 dark:text-stone/60 mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && uploadTo(field, e.target.files[0])}
            className="text-xs"
          />
          {uploadingField === field && <span className="text-xs text-ink/40 dark:text-stone/50">Uploading…</span>}
        </div>
        {draft[field] && (
          <img src={imageUrl(draft[field])!} alt="" className="w-16 h-16 object-cover border border-ink/10 dark:border-stone/10 mt-2" />
        )}
      </div>
    );
  }

  const currentProject = editingId ? projects.find((p) => p.id === editingId) : null;

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Admin</div>
            <h1 className="font-display text-3xl">Portfolio Projects</h1>
          </div>
          <button onClick={startAdd} className="btn-primary text-sm">
            + Add Project
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <p className="text-ink/50 dark:text-stone/60 text-sm">Loading…</p>}

        {adding && (
          <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
            <div className="eyebrow mb-4">{editingId ? 'Edit Project' : 'New Project'}</div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Project title"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <select
                value={draft.service_category_id}
                onChange={(e) => setDraft((d) => ({ ...d, service_category_id: e.target.value }))}
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                value={draft.client_name}
                onChange={(e) => setDraft((d) => ({ ...d, client_name: e.target.value }))}
                placeholder="Client name (optional)"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="Location (optional)"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                type="date"
                value={draft.completed_on}
                onChange={(e) => setDraft((d) => ({ ...d, completed_on: e.target.value }))}
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

            <textarea
              value={draft.summary}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
              placeholder="Short summary"
              rows={2}
              className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring mb-3"
            />
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Full description (supports basic HTML)"
              rows={4}
              className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring mb-4"
            />

            <div className="grid sm:grid-cols-3 gap-4 mb-4 border-t border-brass/20 pt-4">
              <ImageSlot label="Cover Photo (main listing image)" field="cover_image_path" />
              <ImageSlot label="Before Photo (optional)" field="before_image_path" />
              <ImageSlot label="After Photo (optional)" field="after_image_path" />
            </div>

            {editingId ? (
              <div className="mb-4 border-t border-brass/20 pt-4">
                <div className="text-sm text-ink/60 dark:text-stone/60 mb-1">Additional Gallery Photos</div>
                <p className="text-xs text-ink/40 dark:text-stone/50 mb-3">Select several at once — shown on the project's detail page.</p>
                <div className="flex flex-wrap gap-3 mb-3">
                  {(currentProject?.images || []).map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={imageUrl(img.image_path)!} alt="" className="w-20 h-20 object-cover border border-ink/10 dark:border-stone/10" />
                      <button
                        onClick={() => deleteGalleryImage(img.id)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="text-sm" />
                {uploadingGallery && <span className="text-xs text-ink/50 dark:text-stone/60 ml-2">Uploading…</span>}
              </div>
            ) : (
              <p className="text-xs text-ink/40 dark:text-stone/50 mb-4">Save this project first, then you can add gallery photos.</p>
            )}

            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                  className="accent-brass w-4 h-4"
                />
                Featured
              </label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as 'draft' | 'published' }))}
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Project'}
              </button>
              <button onClick={() => setAdding(false)} className="btn-outline text-sm">
                {editingId ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-4 border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-3">
              {p.cover_image_path && (
                <img src={imageUrl(p.cover_image_path)!} alt="" className="w-16 h-16 object-cover flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs text-ink/40 dark:text-stone/50">{p.location || 'No location set'}</div>
              </div>
              {p.featured && <span className="text-xs bg-brass/20 text-brass px-2 py-0.5 rounded-full">Featured</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50 dark:text-stone/60'}`}>
                {p.status}
              </span>
              <button onClick={() => startEdit(p)} className="text-sm hover:text-brass">Edit</button>
              <button onClick={() => remove(p.id)} className="text-sm text-red-700 hover:underline">Delete</button>
            </div>
          ))}
          {!loading && projects.length === 0 && (
            <p className="text-ink/50 dark:text-stone/60 text-sm">No projects yet — add one to get started.</p>
          )}
        </div>
      </div>

  );
}
