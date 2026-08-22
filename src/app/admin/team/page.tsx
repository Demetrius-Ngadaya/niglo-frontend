'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken, imageUrl } from '@/lib/api';
import { AdminCardGridSkeleton } from '@/components/AdminSkeleton';

type Member = {
  id: number;
  full_name: string;
  position: string;
  bio?: string | null;
  photo_path?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  display_order: number;
};

const emptyDraft = { full_name: '', position: '', bio: '', photo_path: '', email: '', phone: '', is_active: true, display_order: 0 };

export default function AdminTeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
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
    adminFetch('/admin/team-members')
      .then(setMembers)
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

  function startEdit(m: Member) {
    setDraft({
      full_name: m.full_name,
      position: m.position,
      bio: m.bio || '',
      photo_path: m.photo_path || '',
      email: m.email || '',
      phone: m.phone || '',
      is_active: m.is_active,
      display_order: m.display_order,
    });
    setEditingId(m.id);
    setAdding(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'team');
      const res = await adminFetch('/admin/upload', { method: 'POST', body: form });
      setDraft((d) => ({ ...d, photo_path: res.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!draft.full_name.trim() || !draft.position.trim()) {
      alert('Please enter a name and position.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminFetch(`/admin/team-members/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(draft),
        });
        setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await adminFetch('/admin/team-members', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
        setMembers((prev) => [...prev, created]);
      }
      setAdding(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save team member.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Remove this team member?')) return;
    try {
      await adminFetch(`/admin/team-members/${id}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Admin</div>
            <h1 className="font-display text-3xl">Team</h1>
          </div>
          <button onClick={startAdd} className="btn-primary text-sm">
            + Add Team Member
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <AdminCardGridSkeleton />}

        {adding && (
          <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
            <div className="eyebrow mb-4">{editingId ? 'Edit Team Member' : 'New Team Member'}</div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={draft.full_name}
                onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
                placeholder="Full name"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                value={draft.position}
                onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
                placeholder="Position / title"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                placeholder="Email (optional)"
                className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
              />
              <input
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                placeholder="Phone (optional)"
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
              value={draft.bio}
              onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
              placeholder="Short bio"
              rows={3}
              className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring mb-4"
            />

            <div className="flex items-center gap-3 mb-4">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm" />
              {uploading && <span className="text-xs text-ink/50 dark:text-stone/60">Uploading…</span>}
              {draft.photo_path && (
                <img src={imageUrl(draft.photo_path)!} alt="" className="w-14 h-14 rounded-full object-cover border border-ink/10 dark:border-stone/10" />
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
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Team Member'}
              </button>
              <button onClick={() => setAdding(false)} className="btn-outline text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div key={m.id} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-4 flex items-center gap-3">
              {m.photo_path ? (
                <img src={imageUrl(m.photo_path)!} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-stoneDark dark:bg-white/5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{m.full_name}</div>
                <div className="text-xs text-ink/50 dark:text-stone/60 truncate">{m.position}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {!m.is_active && <span className="text-xs bg-ink/10 text-ink/50 dark:text-stone/60 px-2 py-0.5 rounded-full">Inactive</span>}
                <div className="flex gap-2">
                  <button onClick={() => startEdit(m)} className="text-xs hover:text-brass">Edit</button>
                  <button onClick={() => remove(m.id)} className="text-xs text-red-700 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {!loading && members.length === 0 && (
            <p className="text-ink/50 dark:text-stone/60 text-sm">No team members yet — add one to get started.</p>
          )}
        </div>
      </div>

  );
}
