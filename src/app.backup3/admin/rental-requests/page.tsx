'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch, adminToken } from '@/lib/api';

type RentalItem = { id: number; name: string; quantity: number };

type RentalRequest = {
  id: number;
  reference_no: string;
  full_name: string;
  email?: string | null;
  phone: string;
  items: RentalItem[];
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  location?: string | null;
  details?: string | null;
  status: 'new' | 'reviewing' | 'confirmed' | 'rejected' | 'completed';
  admin_notes?: string | null;
  created_at: string;
};

const STATUSES = ['new', 'reviewing', 'confirmed', 'rejected', 'completed'] as const;

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-brass/20 text-brass',
  reviewing: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-ink/10 text-ink/60 dark:text-stone/60',
};

export default function AdminRentalRequestsPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-6 py-16 text-ink/50 dark:text-stone/60 text-sm">Loading…</div>}>
      <RentalRequestsContent />
    </Suspense>
  );
}

function RentalRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ status: string; admin_notes: string }>({ status: '', admin_notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    adminFetch(`/admin/rental-requests${qs}`)
      .then((res) => setItems(res.data ?? res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, router]);

  useEffect(() => {
    load();
  }, [load]);

  function openRow(item: RentalRequest) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    setDraft({ status: item.status, admin_notes: item.admin_notes || '' });
  }

  async function saveRow(id: number) {
    setSaving(true);
    try {
      await adminFetch(`/admin/rental-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...draft } as RentalRequest : it)));
      setExpandedId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(id: number) {
    if (!confirm('Delete this equipment request? This cannot be undone.')) return;
    try {
      await adminFetch(`/admin/rental-requests/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((it) => it.id !== id));
      setExpandedId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="eyebrow mb-2">Admin</div>
        <h1 className="font-display text-3xl mb-8">Equipment Rental Requests</h1>

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
              {s}
            </button>
          ))}
        </div>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}
        {loading && <p className="text-ink/50 dark:text-stone/60 text-sm">Loading…</p>}

        {!loading && items.length === 0 && (
          <p className="text-ink/50 dark:text-stone/60 text-sm">No equipment requests found.</p>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5">
              <button
                onClick={() => openRow(item)}
                className="w-full flex flex-wrap items-center gap-4 px-5 py-4 text-left hover:bg-white/60 dark:bg-white/5 transition-colors"
              >
                <span className="font-mono text-xs text-ink/50 dark:text-stone/60 w-32 flex-shrink-0">{item.reference_no}</span>
                <span className="font-medium flex-1 min-w-[140px]">{item.full_name}</span>
                <span className="text-sm text-ink/60 dark:text-stone/60 hidden sm:block">{item.phone}</span>
                <span className="text-sm text-ink/60 dark:text-stone/60 hidden md:block">
                  {item.items.length} item{item.items.length > 1 ? 's' : ''}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[item.status]}`}>
                  {item.status}
                </span>
              </button>

              {expandedId === item.id && (
                <div className="border-t border-ink/10 dark:border-stone/10 px-5 py-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div><span className="text-ink/50 dark:text-stone/60">Email:</span> {item.email || '—'}</div>
                    <div><span className="text-ink/50 dark:text-stone/60">Location:</span> {item.location || '—'}</div>
                    <div><span className="text-ink/50 dark:text-stone/60">Start date:</span> {item.rental_start_date ? new Date(item.rental_start_date).toLocaleDateString() : '—'}</div>
                    <div><span className="text-ink/50 dark:text-stone/60">End date:</span> {item.rental_end_date ? new Date(item.rental_end_date).toLocaleDateString() : '—'}</div>
                  </div>

                  <div>
                    <div className="text-ink/50 dark:text-stone/60 text-sm mb-1">Equipment requested:</div>
                    <div className="space-y-1">
                      {item.items.map((eq, i) => (
                        <div key={i} className="text-sm bg-stoneDark dark:bg-white/5 inline-block px-3 py-1 mr-2">
                          {eq.name} &times; {eq.quantity}
                        </div>
                      ))}
                    </div>
                  </div>

                  {item.details && (
                    <div>
                      <div className="text-ink/50 dark:text-stone/60 text-sm mb-1">Details:</div>
                      <p className="text-sm">{item.details}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-ink/50 dark:text-stone/60 text-sm block mb-1">Status</label>
                      <select
                        value={draft.status}
                        onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                        className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white capitalize focus-ring"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-ink/50 dark:text-stone/60 text-sm block mb-1">Admin notes</label>
                    <textarea
                      value={draft.admin_notes}
                      onChange={(e) => setDraft((d) => ({ ...d, admin_notes: e.target.value }))}
                      rows={3}
                      className="w-full border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white focus-ring"
                      placeholder="Internal notes — availability check, pickup arrangements, etc."
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={() => saveRow(item.id)} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => deleteRow(item.id)} className="text-sm text-red-700 hover:underline ml-auto">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

  );
}
