'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken } from '@/lib/api';

type Message = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function AdminContactMessagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    const qs = unreadOnly ? '?unread=1' : '';
    adminFetch(`/admin/contact-messages${qs}`)
      .then((res) => setItems(res.data ?? res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [unreadOnly, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function openMessage(m: Message) {
    setExpandedId(expandedId === m.id ? null : m.id);
    if (!m.is_read) {
      try {
        await adminFetch(`/admin/contact-messages/${m.id}/read`, { method: 'PUT' });
        setItems((prev) => prev.map((it) => (it.id === m.id ? { ...it, is_read: true } : it)));
      } catch {
        // Non-critical — the message still opens even if marking read fails.
      }
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this message?')) return;
    try {
      await adminFetch(`/admin/contact-messages/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="eyebrow mb-2">Admin</div>
        <h1 className="font-display text-3xl mb-8">Contact Messages</h1>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`px-4 py-2 text-sm border ${!unreadOnly ? 'bg-ink text-stone border-ink' : 'border-ink/15 dark:border-stone/15 hover:border-brass'}`}
          >
            All
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`px-4 py-2 text-sm border ${unreadOnly ? 'bg-ink text-stone border-ink' : 'border-ink/15 dark:border-stone/15 hover:border-brass'}`}
          >
            Unread
          </button>
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <p className="text-ink/50 dark:text-stone/60 text-sm">Loading…</p>}

        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className={`border bg-white/40 dark:bg-white/5 ${m.is_read ? 'border-ink/10 dark:border-stone/10' : 'border-brass/40'}`}>
              <button onClick={() => openMessage(m)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/60 dark:bg-white/5 transition-colors">
                {!m.is_read && <span className="w-2 h-2 rounded-full bg-brass flex-shrink-0" />}
                <span className={`flex-1 text-sm ${m.is_read ? 'font-normal' : 'font-semibold'}`}>{m.name}</span>
                <span className="text-sm text-ink/50 dark:text-stone/60 hidden sm:block">{m.subject || 'No subject'}</span>
                <span className="text-xs text-ink/40 dark:text-stone/50">{new Date(m.created_at).toLocaleDateString()}</span>
              </button>

              {expandedId === m.id && (
                <div className="border-t border-ink/10 dark:border-stone/10 px-5 py-5 space-y-3">
                  <div className="text-sm space-y-1">
                    <div><span className="text-ink/50 dark:text-stone/60">Email:</span> {m.email}</div>
                    {m.phone && <div><span className="text-ink/50 dark:text-stone/60">Phone:</span> {m.phone}</div>}
                    {m.subject && <div><span className="text-ink/50 dark:text-stone/60">Subject:</span> {m.subject}</div>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  <div className="flex gap-3 pt-2">
                    <a href={`mailto:${m.email}`} className="btn-outline text-sm">Reply by Email</a>
                    <button onClick={() => remove(m.id)} className="text-sm text-red-700 hover:underline ml-auto">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!loading && items.length === 0 && (
            <p className="text-ink/50 dark:text-stone/60 text-sm">No messages found.</p>
          )}
        </div>
      </div>

  );
}
