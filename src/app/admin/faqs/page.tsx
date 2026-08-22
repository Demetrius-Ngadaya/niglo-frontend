'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken } from '@/lib/api';
import { AdminBlockListSkeleton } from '@/components/AdminSkeleton';

type Faq = { id: number; question: string; answer: string; display_order: number; is_active: boolean };

const emptyDraft = { question: '', answer: '', display_order: 0, is_active: true };

export default function AdminFaqsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    adminFetch('/admin/faqs')
      .then(setFaqs)
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

  function startEdit(faq: Faq) {
    setDraft({ question: faq.question, answer: faq.answer, display_order: faq.display_order, is_active: faq.is_active });
    setEditingId(faq.id);
    setAdding(true);
  }

  async function save() {
    if (!draft.question.trim() || !draft.answer.trim()) {
      alert('Please enter both a question and an answer.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminFetch(`/admin/faqs/${editingId}`, { method: 'PUT', body: JSON.stringify(draft) });
        setFaqs((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      } else {
        const created = await adminFetch('/admin/faqs', { method: 'POST', body: JSON.stringify(draft) });
        setFaqs((prev) => [...prev, created]);
      }
      setAdding(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save FAQ.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await adminFetch(`/admin/faqs/${id}`, { method: 'DELETE' });
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="eyebrow mb-2">Admin</div>
          <h1 className="font-display text-3xl">FAQs</h1>
        </div>
        <button onClick={startAdd} className="btn-primary text-sm">+ Add FAQ</button>
      </div>

      {error && <p className="text-red-700 dark:text-red-400 text-sm mb-6">{error}</p>}
      {loading && <AdminBlockListSkeleton />}

      {adding && (
        <div className="border border-brass/30 bg-brass/5 p-5 mb-8">
          <div className="eyebrow mb-4">{editingId ? 'Edit FAQ' : 'New FAQ'}</div>
          <input
            value={draft.question}
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
            placeholder="Question"
            className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring mb-3"
          />
          <textarea
            value={draft.answer}
            onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
            placeholder="Answer"
            rows={4}
            className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring mb-4"
          />
          <div className="flex items-center gap-4 mb-4">
            <input
              type="number"
              value={draft.display_order}
              onChange={(e) => setDraft((d) => ({ ...d, display_order: Number(e.target.value) }))}
              placeholder="Display order"
              className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white dark:bg-white/5 text-sm focus-ring w-40"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
                className="accent-brass w-4 h-4"
              />
              Active
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save FAQ'}
            </button>
            <button onClick={() => setAdding(false)} className="btn-outline text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="font-medium text-sm">{faq.question}</div>
              <div className="flex gap-2 flex-shrink-0">
                {!faq.is_active && <span className="text-xs bg-ink/10 dark:bg-stone/10 text-ink/50 dark:text-stone/50 px-2 py-0.5 rounded-full">Inactive</span>}
                <button onClick={() => startEdit(faq)} className="text-xs hover:text-brass">Edit</button>
                <button onClick={() => remove(faq.id)} className="text-xs text-red-700 dark:text-red-400 hover:underline">Delete</button>
              </div>
            </div>
            <p className="text-sm text-ink/60 dark:text-stone/60 mt-1 line-clamp-2">{faq.answer}</p>
          </div>
        ))}
        {!loading && faqs.length === 0 && <p className="text-ink/50 dark:text-stone/50 text-sm">No FAQs yet.</p>}
      </div>
    </div>
  );
}
