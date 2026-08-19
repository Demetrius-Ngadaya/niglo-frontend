'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';

type AlbumImage = { id: number; image_path: string; caption?: string | null };

type Album = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  cover_image_path?: string | null;
  is_active: boolean;
  display_order: number;
  images?: AlbumImage[];
};

const emptyDraft = { title: '', description: '', cover_image_path: '', is_active: true, display_order: 0 };

export default function AdminGalleryPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    adminFetch('/admin/gallery-albums')
      .then(setAlbums)
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

  function startEdit(album: Album) {
    setDraft({
      title: album.title,
      description: album.description || '',
      cover_image_path: album.cover_image_path || '',
      is_active: album.is_active,
      display_order: album.display_order,
    });
    setEditingId(album.id);
    setAdding(true);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'gallery');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, cover_image_path: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handlePhotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingId) return;
    setUploadingPhotos(true);
    const failed: string[] = [];
    try {
      for (const file of Array.from(files)) {
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('folder', 'gallery');
          const uploaded = await adminFetch('/admin/upload', { method: 'POST', body: form });
          const image = await adminFetch(`/admin/gallery-albums/${editingId}/images`, {
            method: 'POST',
            body: JSON.stringify({ image_path: uploaded.path }),
          });
          setAlbums((prev) =>
            prev.map((a) => (a.id === editingId ? { ...a, images: [...(a.images || []), image] } : a))
          );
        } catch (err) {
          failed.push(`${file.name} (${err instanceof Error ? err.message : 'upload failed'})`);
        }
      }
      if (failed.length > 0) {
        alert(`${failed.length} photo(s) could not be uploaded:\n\n${failed.join('\n')}`);
      }
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  }

  async function deletePhoto(imageId: number) {
    if (!editingId) return;
    if (!confirm('Remove this photo?')) return;
    try {
      await adminFetch(`/admin/gallery-albums/${editingId}/images/${imageId}`, { method: 'DELETE' });
      setAlbums((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, images: (a.images || []).filter((i) => i.id !== imageId) } : a))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove photo.');
    }
  }

  async function save() {
    if (!draft.title.trim()) {
      alert('Please enter an album title.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminFetch(`/admin/gallery-albums/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(draft),
        });
        setAlbums((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
      } else {
        const created = await adminFetch('/admin/gallery-albums', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
        setAlbums((prev) => [...prev, { ...created, images: [] }]);
        setEditingId(created.id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save album.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this album and all its photos?')) return;
    try {
      await adminFetch(`/admin/gallery-albums/${id}`, { method: 'DELETE' });
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) setAdding(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  const currentAlbum = editingId ? albums.find((a) => a.id === editingId) : null;

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Admin</div>
            <h1 className="font-display text-3xl">Gallery</h1>
          </div>
          <button onClick={startAdd} className="btn-primary text-sm">
            + Add Album
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <p className="text-ink/50 text-sm">Loading…</p>}

        {adding && (
          <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
            <div className="eyebrow mb-4">{editingId ? 'Edit Album' : 'New Album'}</div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Album title"
                className="border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                type="number"
                value={draft.display_order}
                onChange={(e) => setDraft((d) => ({ ...d, display_order: Number(e.target.value) }))}
                placeholder="Display order"
                className="border border-ink/15 px-3 py-2 bg-white text-sm focus-ring"
              />
            </div>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Description"
              rows={2}
              className="w-full border border-ink/15 px-3 py-2 bg-white text-sm focus-ring mb-4"
            />

            <div className="mb-4">
              <div className="text-sm text-ink/60 mb-2">Cover Photo</div>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="text-sm" />
                {uploadingCover && <span className="text-xs text-ink/50">Uploading…</span>}
                {draft.cover_image_path && (
                  <img src={imageUrl(draft.cover_image_path)!} alt="" className="w-14 h-14 object-cover border border-ink/10" />
                )}
              </div>
            </div>

            {editingId ? (
              <div className="mb-4 border-t border-brass/20 pt-4">
                <div className="text-sm text-ink/60 mb-1">Album Photos</div>
                <p className="text-xs text-ink/40 mb-3">Select several at once.</p>
                <div className="flex flex-wrap gap-3 mb-3">
                  {(currentAlbum?.images || []).map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={imageUrl(img.image_path)!} alt="" className="w-20 h-20 object-cover border border-ink/10" />
                      <button
                        onClick={() => deletePhoto(img.id)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <input type="file" accept="image/*" multiple onChange={handlePhotosUpload} className="text-sm" />
                {uploadingPhotos && <span className="text-xs text-ink/50 ml-2">Uploading…</span>}
              </div>
            ) : (
              <p className="text-xs text-ink/40 mb-4">Save this album first, then you can add photos.</p>
            )}

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
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Album'}
              </button>
              <button onClick={() => setAdding(false)} className="btn-outline text-sm">
                {editingId ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((album) => (
            <div key={album.id} className="border border-ink/10 bg-white/40 p-4">
              {album.cover_image_path && (
                <img src={imageUrl(album.cover_image_path)!} alt="" className="w-full h-32 object-cover mb-3" />
              )}
              <div className="text-sm font-medium mb-1">{album.title}</div>
              <div className="text-xs text-ink/40 mb-3">{album.images?.length ?? 0} photos</div>
              <div className="flex items-center gap-3">
                {!album.is_active && <span className="text-xs bg-ink/10 text-ink/50 px-2 py-0.5 rounded-full">Inactive</span>}
                <button onClick={() => startEdit(album)} className="text-sm hover:text-brass">Edit</button>
                <button onClick={() => remove(album.id)} className="text-sm text-red-700 hover:underline">Delete</button>
              </div>
            </div>
          ))}
          {!loading && albums.length === 0 && (
            <p className="text-ink/50 text-sm">No albums yet — add one to get started.</p>
          )}
        </div>
      </div>

  );
}
