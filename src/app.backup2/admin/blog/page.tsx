'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_path?: string | null;
  status: 'draft' | 'published';
  featured: boolean;
  views: number;
  published_at?: string | null;
  category?: { id: number; name: string } | null;
};

const emptyDraft = {
  category: '',
  title: '',
  excerpt: '',
  content: '',
  cover_image_path: '',
  status: 'published' as 'draft' | 'published',
  featured: false,
};

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
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
    adminFetch('/admin/blog-posts')
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    posts.forEach((p) => {
      if (p.category?.name) names.add(p.category.name);
    });
    return Array.from(names);
  }, [posts]);

  function startAdd() {
    setDraft(emptyDraft);
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(p: Post) {
    setDraft({
      category: p.category?.name || '',
      title: p.title,
      excerpt: p.excerpt || '',
      content: p.content || '',
      cover_image_path: p.cover_image_path || '',
      status: p.status,
      featured: p.featured,
    });
    setEditingId(p.id);
    setAdding(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'blog');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, cover_image_path: res.path }));
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
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminFetch(`/admin/blog-posts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(draft),
        });
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await adminFetch('/admin/blog-posts', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
        setPosts((prev) => [created, ...prev]);
      }
      setAdding(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save post.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this post?')) return;
    try {
      await adminFetch(`/admin/blog-posts/${id}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Admin</div>
            <h1 className="font-display text-3xl">Blog</h1>
          </div>
          <button onClick={startAdd} className="btn-primary text-sm">
            + Add Post
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <p className="text-ink/50 text-sm">Loading…</p>}

        {adding && (
          <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
            <div className="eyebrow mb-4">{editingId ? 'Edit Post' : 'New Post'}</div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Post title"
                className="border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <div>
                <input
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  placeholder="Category (e.g. Interior Tips)"
                  list="blog-categories"
                  className="w-full border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
                />
                <datalist id="blog-categories">
                  {categoryNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>

            <textarea
              value={draft.excerpt}
              onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
              placeholder="Short excerpt (shown on the blog listing)"
              rows={2}
              className="w-full border border-ink/15 px-3 py-2 bg-white text-sm focus-ring mb-3"
            />
            <textarea
              value={draft.content}
              onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
              placeholder="Full content (supports basic HTML)"
              rows={8}
              className="w-full border border-ink/15 px-3 py-2 bg-white text-sm focus-ring mb-4"
            />

            <div className="flex items-center gap-3 mb-4">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
              {uploading && <span className="text-xs text-ink/50">Uploading…</span>}
              {draft.cover_image_path && (
                <img src={imageUrl(draft.cover_image_path)!} alt="" className="w-14 h-14 object-cover border border-ink/10" />
              )}
            </div>

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
                className="border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Post'}
              </button>
              <button onClick={() => setAdding(false)} className="btn-outline text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center gap-4 border border-ink/10 bg-white/40 p-3">
              {p.cover_image_path && (
                <img src={imageUrl(p.cover_image_path)!} alt="" className="w-16 h-16 object-cover flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs text-ink/40">
                  {p.category?.name || 'Uncategorized'} &middot; {p.views} views
                </div>
              </div>
              {p.featured && <span className="text-xs bg-brass/20 text-brass px-2 py-0.5 rounded-full">Featured</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-ink/10 text-ink/50'}`}>
                {p.status}
              </span>
              <button onClick={() => startEdit(p)} className="text-sm hover:text-brass">Edit</button>
              <button onClick={() => remove(p.id)} className="text-sm text-red-700 hover:underline">Delete</button>
            </div>
          ))}
          {!loading && posts.length === 0 && (
            <p className="text-ink/50 text-sm">No posts yet — add one to get started.</p>
          )}
        </div>
      </div>

  );
}
