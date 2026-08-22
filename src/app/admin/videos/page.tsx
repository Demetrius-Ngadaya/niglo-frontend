'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';

type Video = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_path?: string | null;
  video_path?: string | null;
  video_url?: string | null;
  display_order: number;
  is_active: boolean;
};

const emptyDraft = {
  title: '',
  description: '',
  thumbnail_path: '',
  video_path: '',
  video_url: '',
  display_order: 0,
  is_active: true,
};

export default function AdminVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [sourceMode, setSourceMode] = useState<'upload' | 'link'>('link');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    adminFetch('/admin/videos')
      .then(setVideos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function startAdd() {
    setDraft(emptyDraft);
    setSourceMode('link');
    setEditingId(null);
    setAdding(true);
  }

  function startEdit(video: Video) {
    setDraft({
      title: video.title,
      description: video.description || '',
      thumbnail_path: video.thumbnail_path || '',
      video_path: video.video_path || '',
      video_url: video.video_url || '',
      display_order: video.display_order,
      is_active: video.is_active,
    });
    setSourceMode(video.video_path ? 'upload' : 'link');
    setEditingId(video.id);
    setAdding(true);
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'videos');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, thumbnail_path: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Thumbnail upload failed.');
    } finally {
      setUploadingThumb(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'videos');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, video_path: res.path, video_url: '' }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Video upload failed. Large files may need a bigger server upload limit — see the README.');
    } finally {
      setUploadingVideo(false);
    }
  }

  async function save() {
    if (!draft.title.trim()) {
      alert('Please enter a title.');
      return;
    }
    if (sourceMode === 'upload' && !draft.video_path) {
      alert('Please upload a video file, or switch to "Video link" and paste a URL instead.');
      return;
    }
    if (sourceMode === 'link' && !draft.video_url.trim()) {
      alert('Please paste a video link, or switch to "Upload file" instead.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...draft,
        video_path: sourceMode === 'upload' ? draft.video_path : null,
        video_url: sourceMode === 'link' ? draft.video_url : null,
      };

      if (editingId) {
        const updated = await adminFetch(`/admin/videos/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      } else {
        const created = await adminFetch('/admin/videos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setVideos((prev) => [...prev, created]);
      }
      setAdding(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save video.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this video?')) return;
    try {
      await adminFetch(`/admin/videos/${id}`, { method: 'DELETE' });
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="eyebrow mb-2">Admin</div>
          <h1 className="font-display text-3xl">Videos</h1>
          <p className="text-sm text-ink/50 dark:text-stone/50 mt-2 max-w-lg">
            Upload a video file directly, or paste a link from YouTube, Vimeo, Facebook,
            Instagram, or anywhere else.
          </p>
        </div>
        <button onClick={startAdd} className="btn-primary text-sm">
          + Add Video
        </button>
      </div>

      {error && <p className="text-red-700 dark:text-red-400 text-sm mb-6">{error}</p>}
      {loading && <p className="text-ink/50 dark:text-stone/50 text-sm">Loading…</p>}

      {adding && (
        <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
          <div className="eyebrow mb-4">{editingId ? 'Edit Video' : 'New Video'}</div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
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
            placeholder="Description (optional)"
            rows={2}
            className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring mb-4"
          />

          <div className="mb-4">
            <div className="text-sm text-ink/60 dark:text-stone/60 mb-2">Thumbnail image</div>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="text-sm" />
              {uploadingThumb && <span className="text-xs text-ink/50 dark:text-stone/50">Uploading…</span>}
              {draft.thumbnail_path && (
                <img src={imageUrl(draft.thumbnail_path)!} alt="" className="w-16 h-10 object-cover border border-ink/10" />
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSourceMode('link')}
                className={`px-4 py-2 text-sm border ${sourceMode === 'link' ? 'bg-ink text-stone border-ink' : 'border-ink/15 dark:border-stone/15 hover:border-brass'}`}
              >
                Video Link
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('upload')}
                className={`px-4 py-2 text-sm border ${sourceMode === 'upload' ? 'bg-ink text-stone border-ink' : 'border-ink/15 dark:border-stone/15 hover:border-brass'}`}
              >
                Upload File
              </button>
            </div>

            {sourceMode === 'link' ? (
              <input
                value={draft.video_url}
                onChange={(e) => setDraft((d) => ({ ...d, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... or Vimeo / Facebook / Instagram / TikTok link"
                className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring"
              />
            ) : (
              <div>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="text-sm" />
                {uploadingVideo && <span className="text-xs text-ink/50 dark:text-stone/50 ml-2">Uploading… large files can take a while</span>}
                {draft.video_path && !uploadingVideo && (
                  <p className="text-xs text-green-700 dark:text-green-400 mt-2">Video uploaded ✓</p>
                )}
              </div>
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
              {saving ? 'Saving…' : 'Save Video'}
            </button>
            <button onClick={() => setAdding(false)} className="btn-outline text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {videos.map((video) => (
          <div key={video.id} className="flex items-center gap-4 border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-3">
            <div className="w-24 h-14 bg-ink flex items-center justify-center flex-shrink-0 overflow-hidden">
              {video.thumbnail_path && (
                <img src={imageUrl(video.thumbnail_path)!} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{video.title}</div>
              <div className="text-xs text-ink/40 dark:text-stone/40">
                {video.video_path ? 'Uploaded file' : 'External link'}
              </div>
            </div>
            {!video.is_active && <span className="text-xs bg-ink/10 dark:bg-stone/10 text-ink/50 dark:text-stone/50 px-2 py-0.5 rounded-full">Inactive</span>}
            <button onClick={() => startEdit(video)} className="text-sm hover:text-brass">Edit</button>
            <button onClick={() => remove(video.id)} className="text-sm text-red-700 dark:text-red-400 hover:underline">Delete</button>
          </div>
        ))}
        {!loading && videos.length === 0 && (
          <p className="text-ink/50 dark:text-stone/50 text-sm">No videos yet — add one to get started.</p>
        )}
      </div>
    </div>
  );
}
