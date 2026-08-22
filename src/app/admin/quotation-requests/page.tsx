'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch, adminToken, API_URL, imageUrl } from '@/lib/api';
import { AdminBlockListSkeleton } from '@/components/AdminSkeleton';

type QuoteItem = { description: string; quantity: number; unit_price: number; line_total?: number };

type QuotationRequest = {
  id: number;
  reference_no: string;
  full_name: string;
  email?: string | null;
  phone: string;
  project_type: string;
  selected_services: string[];
  location?: string | null;
  budget_range?: string | null;
  preferred_start_date?: string | null;
  details?: string | null;
  status: 'new' | 'reviewing' | 'quoted' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string | null;
  quote_items?: QuoteItem[] | null;
  quote_total?: string | null;
  quote_currency?: string | null;
  quote_valid_until?: string | null;
  receipts?: { id: number; path: string; uploaded_at: string }[];
  created_at: string;
};

const STATUSES = ['new', 'reviewing', 'quoted', 'approved', 'rejected', 'completed'] as const;

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-brass/20 text-brass',
  reviewing: 'bg-blue-100 text-blue-700',
  quoted: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-ink/10 text-ink/60 dark:text-stone/60',
};

const emptyItem = (): QuoteItem => ({ description: '', quantity: 1, unit_price: 0 });

export default function QuotationRequestsPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-6 py-16 text-ink/50 dark:text-stone/60 text-sm">Loading…</div>}>
      <QuotationRequestsContent />
    </Suspense>
  );
}

function QuotationRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<QuotationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ status: string; admin_notes: string }>({ status: '', admin_notes: '' });
  const [saving, setSaving] = useState(false);

  // Quote builder state
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([emptyItem()]);
  const [quoteValidUntil, setQuoteValidUntil] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    adminFetch(`/admin/quotation-requests${qs}`)
      .then((res) => setItems(res.data ?? res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, router]);

  useEffect(() => {
    load();
  }, [load]);

  function openRow(item: QuotationRequest) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    setDraft({ status: item.status, admin_notes: item.admin_notes || '' });
    setQuoteItems(
      item.quote_items && item.quote_items.length > 0
        ? item.quote_items.map((qi) => ({ description: qi.description, quantity: qi.quantity, unit_price: qi.unit_price }))
        : [emptyItem()]
    );
    setQuoteValidUntil(item.quote_valid_until || '');
    setQuoteError(null);
  }

  async function saveRow(id: number) {
    setSaving(true);
    try {
      await adminFetch(`/admin/quotation-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...draft } as QuotationRequest : it)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(id: number) {
    if (!confirm('Delete this quotation request? This cannot be undone.')) return;
    try {
      await adminFetch(`/admin/quotation-requests/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((it) => it.id !== id));
      setExpandedId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }

  async function downloadPdf(item: QuotationRequest) {
    try {
      const res = await fetch(`${API_URL}/admin/quotation-requests/${item.id}/quote-pdf`, {
        headers: { Authorization: `Bearer ${adminToken()}` },
      });
      if (!res.ok) throw new Error('Failed to generate PDF.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quotation-${item.reference_no}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download PDF.');
    }
  }

  function updateQuoteItem(index: number, field: keyof QuoteItem, value: string) {
    setQuoteItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: field === 'description' ? value : Number(value) }
          : item
      )
    );
  }

  function addQuoteItem() {
    setQuoteItems((prev) => [...prev, emptyItem()]);
  }

  function removeQuoteItem(index: number) {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  }

  const quoteTotal = quoteItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);

  async function sendQuote(id: number) {
    setQuoteError(null);

    const validItems = quoteItems.filter((it) => it.description.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      setQuoteError('Add at least one line item with a description and quantity.');
      return;
    }

    setSendingQuote(true);
    try {
      const updated = await adminFetch(`/admin/quotation-requests/${id}/quote`, {
        method: 'POST',
        body: JSON.stringify({
          quote_items: validItems,
          quote_valid_until: quoteValidUntil || null,
        }),
      });
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      setExpandedId(null);
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Failed to send quotation.');
    } finally {
      setSendingQuote(false);
    }
  }

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="eyebrow mb-2">Admin</div>
        <h1 className="font-display text-3xl mb-8">Quotation Requests</h1>

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
        {loading && <AdminBlockListSkeleton />}

        {!loading && items.length === 0 && (
          <p className="text-ink/50 dark:text-stone/60 text-sm">No quotation requests found.</p>
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
                <span className="text-sm text-ink/60 dark:text-stone/60 hidden md:block">{item.project_type}</span>
                {item.quote_total && (
                  <span className="text-sm font-medium text-brass hidden lg:block">
                    {Number(item.quote_total).toLocaleString()} {item.quote_currency}
                  </span>
                )}
                {item.receipts && item.receipts.length > 0 && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                    {item.receipts.length} Receipt{item.receipts.length > 1 ? 's' : ''}
                  </span>
                )}
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[item.status]}`}>
                  {item.status}
                </span>
              </button>

              {expandedId === item.id && (
                <div className="border-t border-ink/10 dark:border-stone/10 px-5 py-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div><span className="text-ink/50 dark:text-stone/60">Email:</span> {item.email || '—'}</div>
                    <div><span className="text-ink/50 dark:text-stone/60">Location:</span> {item.location || '—'}</div>
                    <div><span className="text-ink/50 dark:text-stone/60">Budget:</span> {item.budget_range || '—'}</div>
                    <div><span className="text-ink/50 dark:text-stone/60">Preferred start:</span> {item.preferred_start_date ? new Date(item.preferred_start_date).toLocaleDateString() : '—'}</div>
                  </div>

                  <div>
                    <div className="text-ink/50 dark:text-stone/60 text-sm mb-1">Services requested:</div>
                    <div className="flex flex-wrap gap-2">
                      {item.selected_services.map((s) => (
                        <span key={s} className="text-xs bg-stoneDark dark:bg-white/5 px-3 py-1">{s}</span>
                      ))}
                    </div>
                  </div>

                  {item.details && (
                    <div>
                      <div className="text-ink/50 dark:text-stone/60 text-sm mb-1">Details:</div>
                      <p className="text-sm">{item.details}</p>
                    </div>
                  )}

                  {/* --- Payment receipts --- */}
                  {item.receipts && item.receipts.length > 0 && (
                    <div className="border border-green-200 bg-green-50/50 p-5">
                      <div className="eyebrow mb-3">
                        Payment Receipts ({item.receipts.length})
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {item.receipts.map((r) => (
                          <div key={r.id}>
                            {r.path.toLowerCase().endsWith('.pdf') ? (
                              <a href={imageUrl(r.path)!} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm">
                                View PDF Receipt
                              </a>
                            ) : (
                              <a href={imageUrl(r.path)!} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={imageUrl(r.path)!}
                                  alt="Payment receipt"
                                  className="w-32 h-32 object-cover border border-ink/10 dark:border-stone/10 hover:opacity-90 transition-opacity"
                                />
                              </a>
                            )}
                            <p className="text-xs text-ink/50 dark:text-stone/60 mt-1">
                              {new Date(r.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* --- Quote builder --- */}
                  <div className="border border-brass/30 bg-brass/5 p-5">
                    <div className="eyebrow mb-4">Prepare Quotation</div>

                    <div className="space-y-2 mb-4">
                      <div className="hidden sm:grid grid-cols-[1fr_80px_120px_120px_32px] gap-2 text-xs text-ink/50 dark:text-stone/60 px-1">
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Unit Price</span>
                        <span>Line Total</span>
                        <span></span>
                      </div>
                      {quoteItems.map((qi, i) => (
                        <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_80px_120px_120px_32px] gap-2 items-center">
                          <input
                            value={qi.description}
                            onChange={(e) => updateQuoteItem(i, 'description', e.target.value)}
                            placeholder="e.g. 60x60 floor tiles, supply & install"
                            className="col-span-2 sm:col-span-1 border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
                          />
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={qi.quantity}
                            onChange={(e) => updateQuoteItem(i, 'quantity', e.target.value)}
                            className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
                          />
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={qi.unit_price}
                            onChange={(e) => updateQuoteItem(i, 'unit_price', e.target.value)}
                            className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
                          />
                          <div className="text-sm px-1">
                            {((Number(qi.quantity) || 0) * (Number(qi.unit_price) || 0)).toLocaleString()}
                          </div>
                          <button
                            onClick={() => removeQuoteItem(i)}
                            className="text-red-700 text-sm hover:underline text-left"
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <button onClick={addQuoteItem} type="button" className="text-sm text-brass hover:underline mb-4">
                      + Add line item
                    </button>

                    <div className="flex flex-wrap items-end justify-between gap-4 border-t border-brass/20 pt-4">
                      <div>
                        <label className="text-ink/50 dark:text-stone/60 text-sm block mb-1">Valid until (optional)</label>
                        <input
                          type="date"
                          value={quoteValidUntil}
                          onChange={(e) => setQuoteValidUntil(e.target.value)}
                          className="border border-ink/15 dark:border-stone/15 px-3 py-2 bg-white text-sm focus-ring"
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-ink/50 dark:text-stone/60 text-sm">Total (TZS)</div>
                        <div className="font-display text-2xl text-brass">{quoteTotal.toLocaleString()}</div>
                      </div>
                    </div>

                    {quoteError && <p className="text-red-700 text-sm mt-3">{quoteError}</p>}

                    <button
                      onClick={() => sendQuote(item.id)}
                      disabled={sendingQuote}
                      className="btn-primary text-sm mt-4 disabled:opacity-50"
                    >
                      {sendingQuote ? 'Sending…' : item.quote_items ? 'Update & Resend Quotation' : 'Send Quotation to Customer'}
                    </button>
                    <p className="text-xs text-ink/50 dark:text-stone/60 mt-2">
                      This sets status to &quot;Quoted&quot; and emails the customer the full itemized
                      breakdown (with PDF attached), plus a summary via SMS and WhatsApp.
                    </p>
                    {item.quote_items && (
                      <button
                        onClick={() => downloadPdf(item)}
                        type="button"
                        className="btn-outline text-sm mt-3"
                      >
                        Download Current Quotation PDF
                      </button>
                    )}
                  </div>

                  {/* --- Plain status change (no quote) --- */}
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-ink/50 dark:text-stone/60 text-sm block mb-1">Or just change status</label>
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
                      placeholder="Internal notes — follow-up plan, etc."
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={() => saveRow(item.id)} disabled={saving} className="btn-outline text-sm disabled:opacity-50">
                      {saving ? 'Saving…' : 'Save Status/Notes'}
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
