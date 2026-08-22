'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch, adminToken } from '@/lib/api';
import { AdminBlockListSkeleton } from '@/components/AdminSkeleton';

type Message = { id?: number; sender: 'visitor' | 'bot' | 'admin'; message: string; created_at?: string };

type Conversation = {
  id: number;
  conversation_uuid: string;
  visitor_phone?: string | null;
  status: 'open' | 'awaiting_phone' | 'escalated' | 'answered' | 'closed';
  has_unread_admin_reply: boolean;
  created_at: string;
  messages: Message[];
};

const STATUSES = ['open', 'awaiting_phone', 'escalated', 'answered', 'closed'] as const;

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-ink/10 text-ink/60',
  awaiting_phone: 'bg-brass/20 text-brass',
  escalated: 'bg-red-100 text-red-700',
  answered: 'bg-green-100 text-green-700',
  closed: 'bg-ink/10 text-ink/40',
};

export default function AdminChatbotPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-6 py-16 text-ink/50 text-sm">Loading…</div>}>
      <ChatbotContent />
    </Suspense>
  );
}

function ChatbotContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    adminFetch(`/admin/chatbot-conversations${qs}`)
      .then((res) => setItems(res.data ?? res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function openConversation(conv: Conversation) {
    if (expandedId === conv.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(conv.id);
    setReplyText('');
    try {
      const full = await adminFetch(`/admin/chatbot-conversations/${conv.id}`);
      setItems((prev) => prev.map((c) => (c.id === conv.id ? full : c)));
    } catch {
      // Keep the summary view if the detail fetch fails.
    }
  }

  async function sendReply(id: number) {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const updated = await adminFetch(`/admin/chatbot-conversations/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText }),
      });
      setItems((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setReplyText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this conversation?')) return;
    try {
      await adminFetch(`/admin/chatbot-conversations/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">Admin</div>
      <h1 className="font-display text-3xl mb-8">Chatbot Conversations</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 text-sm border ${statusFilter === '' ? 'bg-ink text-stone border-ink' : 'border-ink/15 dark:border-stone/15 hover:border-brass'}`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-sm border capitalize ${statusFilter === s ? 'bg-ink text-stone border-ink' : 'border-ink/15 dark:border-stone/15 hover:border-brass'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && <p className="text-red-700 dark:text-red-400 text-sm mb-6">{error}</p>}
      {loading && <AdminBlockListSkeleton />}
      {!loading && items.length === 0 && <p className="text-ink/50 dark:text-stone/50 text-sm">No conversations found.</p>}

      <div className="space-y-3">
        {items.map((conv) => {
          const lastMessage = conv.messages?.[conv.messages.length - 1];
          return (
            <div key={conv.id} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5">
              <button
                onClick={() => openConversation(conv)}
                className="w-full flex flex-wrap items-center gap-4 px-5 py-4 text-left hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
              >
                <span className="flex-1 text-sm text-ink/70 dark:text-stone/70 truncate">
                  {lastMessage?.message || 'New conversation'}
                </span>
                {conv.visitor_phone && (
                  <span className="text-xs text-ink/50 dark:text-stone/50">{conv.visitor_phone}</span>
                )}
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[conv.status]}`}>
                  {conv.status.replace('_', ' ')}
                </span>
              </button>

              {expandedId === conv.id && (
                <div className="border-t border-ink/10 dark:border-stone/10 px-5 py-5">
                  <div className="space-y-2 max-h-80 overflow-y-auto mb-4 border border-ink/10 dark:border-stone/10 p-3">
                    {(conv.messages || []).map((m, i) => (
                      <div key={i} className={`flex ${m.sender === 'visitor' ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[75%] px-3 py-2 text-sm rounded ${
                            m.sender === 'visitor'
                              ? 'bg-ink/10 dark:bg-stone/10'
                              : m.sender === 'admin'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-brass/20'
                          }`}
                        >
                          <div className="text-[10px] text-ink/40 dark:text-stone/40 mb-0.5 uppercase">{m.sender}</div>
                          {m.message}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendReply(conv.id)}
                      placeholder="Type a reply…"
                      className="flex-1 border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring"
                    />
                    <button
                      onClick={() => sendReply(conv.id)}
                      disabled={sending || !replyText.trim()}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {sending ? 'Sending…' : 'Reply'}
                    </button>
                    <button onClick={() => remove(conv.id)} className="text-sm text-red-700 dark:text-red-400 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
