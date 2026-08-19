'use client';

import { useState } from 'react';
import { API_URL, imageUrl } from '@/lib/api';

type TrackResult = {
  reference_no: string;
  full_name: string;
  project_type: string;
  selected_services: string[];
  status: string;
  submitted_at: string;
  last_updated_at: string;
  quote_items?: { description: string; quantity: number; unit_price: number; line_total: number }[] | null;
  quote_total?: string | null;
  quote_currency?: string | null;
  quote_valid_until?: string | null;
  receipts?: { id: number; path: string; uploaded_at: string }[];
};

type RentalResult = {
  reference_no: string;
  full_name: string;
  items: { id: number; name: string; quantity: number }[];
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  status: string;
  submitted_at: string;
  last_updated_at: string;
};

const RENTAL_STEPS = ['new', 'reviewing', 'confirmed', 'completed'] as const;

const RENTAL_STEP_LABELS: Record<string, string> = {
  new: 'Received',
  reviewing: 'Being Reviewed',
  confirmed: 'Confirmed',
  completed: 'Completed',
};

const STEPS = ['new', 'reviewing', 'quoted', 'approved', 'completed'] as const;

const STEP_LABELS: Record<string, string> = {
  new: 'Received',
  reviewing: 'Being Reviewed',
  quoted: 'Quotation Sent',
  approved: 'Approved',
  completed: 'Completed',
};

export default function TrackRequestPage() {
  const [result, setResult] = useState<TrackResult | null>(null);
  const [rentalResult, setRentalResult] = useState<RentalResult | null>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setRentalResult(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const phoneValue = String(form.get('phone') || '');
    const referenceNo = String(form.get('reference_no') || '').trim();
    const isRental = referenceNo.toUpperCase().startsWith('NG-R-');

    try {
      const res = await fetch(`${API_URL}/${isRental ? 'rental-requests' : 'quotation-requests'}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          reference_no: referenceNo,
          phone: phoneValue,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Request not found.');

      if (isRental) {
        setRentalResult(body);
      } else {
        setResult(body);
      }
      setPhone(phoneValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const isRejected = result?.status === 'rejected';
  const activeIndex = result ? STEPS.indexOf(result.status as typeof STEPS[number]) : -1;

  async function handleReceiptUpload() {
    if (!result || !receiptFile) return;
    setReceiptError(null);
    setUploadingReceipt(true);

    const form = new FormData();
    form.append('phone', phone);
    form.append('receipt', receiptFile);

    try {
      const res = await fetch(`${API_URL}/quotation-requests/${encodeURIComponent(result.reference_no)}/receipt`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Upload failed.');
      setResult((prev) => (prev ? { ...prev, receipts: body.receipts } : prev));
      setReceiptSuccess(true);
      setReceiptFile(null);
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadingReceipt(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Check your request</div>
      <h1 className="font-display text-4xl md:text-5xl mb-4">Track Your Request</h1>
      <p className="text-ink/70 mb-12">
        Enter the reference number from your confirmation and the phone number you
        submitted with.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-12">
        <input
          name="reference_no"
          required
          placeholder="Reference number (e.g. NG-Q-2026-0001 or NG-R-2026-0001)"
          className="flex-1 border border-ink/15 px-4 py-3 bg-white/60 focus-ring"
        />
        <input
          name="phone"
          required
          placeholder="Phone number"
          className="flex-1 border border-ink/15 px-4 py-3 bg-white/60 focus-ring"
        />
        <button type="submit" disabled={loading} className="btn-primary justify-center disabled:opacity-50">
          {loading ? 'Checking…' : 'Track'}
        </button>
      </form>

      {error && <p className="text-red-700 text-sm mb-8">{error}</p>}

      {rentalResult && (
        <div className="border border-ink/10 bg-white/40 p-8 mb-8">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <div className="text-xs text-ink/50 mb-1">Reference</div>
              <div className="font-mono font-semibold">{rentalResult.reference_no}</div>
            </div>
            {rentalResult.rental_start_date && (
              <div className="text-right">
                <div className="text-xs text-ink/50 mb-1">Dates</div>
                <div className="font-medium text-sm">
                  {new Date(rentalResult.rental_start_date).toLocaleDateString()}
                  {rentalResult.rental_end_date ? ` – ${new Date(rentalResult.rental_end_date).toLocaleDateString()}` : ''}
                </div>
              </div>
            )}
          </div>

          {rentalResult.status === 'rejected' ? (
            <div className="bg-red-50 text-red-700 px-5 py-4 text-sm mb-6">
              We&apos;re unable to fulfill this request as submitted. Contact us to discuss alternatives.
            </div>
          ) : (
            <div className="flex items-center mb-8">
              {RENTAL_STEPS.map((step, i) => {
                const activeIndex = RENTAL_STEPS.indexOf(rentalResult.status as typeof RENTAL_STEPS[number]);
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          i <= activeIndex ? 'bg-brass border-brass' : 'bg-white border-ink/20'
                        }`}
                      />
                      <div className="text-[11px] text-ink/60 mt-2 text-center w-16">
                        {RENTAL_STEP_LABELS[step]}
                      </div>
                    </div>
                    {i < RENTAL_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          i < RENTAL_STEPS.indexOf(rentalResult.status as typeof RENTAL_STEPS[number]) ? 'bg-brass' : 'bg-ink/10'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-sm text-ink/60 mb-2">Equipment requested:</div>
          <div className="space-y-1 mb-6">
            {rentalResult.items.map((item, i) => (
              <div key={i} className="text-sm bg-stoneDark px-3 py-2">
                {item.name} &times; {item.quantity}
              </div>
            ))}
          </div>

          <div className="text-xs text-ink/40">
            Submitted {new Date(rentalResult.submitted_at).toLocaleDateString()} &middot; Last updated{' '}
            {new Date(rentalResult.last_updated_at).toLocaleDateString()}
          </div>
        </div>
      )}

      {result && (
        <div className="border border-ink/10 bg-white/40 p-8">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <div className="text-xs text-ink/50 mb-1">Reference</div>
              <div className="font-mono font-semibold">{result.reference_no}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ink/50 mb-1">Project Type</div>
              <div className="font-medium">{result.project_type}</div>
            </div>
          </div>

          {isRejected ? (
            <div className="bg-red-50 text-red-700 px-5 py-4 text-sm mb-4">
              This request was not approved. Contact us if you&apos;d like to discuss further.
            </div>
          ) : (
            <div className="flex items-center mb-8">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        i <= activeIndex ? 'bg-brass border-brass' : 'bg-white border-ink/20'
                      }`}
                    />
                    <div className="text-[11px] text-ink/60 mt-2 text-center w-16">
                      {STEP_LABELS[step]}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${i < activeIndex ? 'bg-brass' : 'bg-ink/10'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {result.quote_items && result.quote_items.length > 0 && (
            <div className="mb-8 border-t border-ink/10 pt-6">
              <div className="eyebrow mb-4">Your Quotation</div>
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="text-left text-ink/50 text-xs">
                    <th className="pb-2 font-normal">Item</th>
                    <th className="pb-2 font-normal text-right">Qty</th>
                    <th className="pb-2 font-normal text-right">Unit Price</th>
                    <th className="pb-2 font-normal text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.quote_items.map((item, i) => (
                    <tr key={i} className="border-t border-ink/5">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{Number(item.unit_price).toLocaleString()}</td>
                      <td className="py-2 text-right">{Number(item.line_total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-baseline border-t-2 border-ink pt-3">
                <span className="font-medium">Total ({result.quote_currency})</span>
                <span className="font-display text-2xl text-brass">
                  {Number(result.quote_total).toLocaleString()}
                </span>
              </div>
              {result.quote_valid_until && (
                <p className="text-xs text-ink/50 mt-2">
                  Valid until {new Date(result.quote_valid_until).toLocaleDateString()}
                </p>
              )}
              <a
                href={`${API_URL}/quotation-requests/${encodeURIComponent(result.reference_no)}/quote-pdf?phone=${encodeURIComponent(phone)}`}
                className="btn-outline text-sm mt-4"
              >
                Download PDF
              </a>

              <div className="mt-8 border-t border-ink/10 pt-6">
                <div className="eyebrow mb-3">Payment Receipts</div>

                {result.receipts && result.receipts.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {result.receipts.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 border border-ink/10 bg-white/50 p-3">
                        {r.path.toLowerCase().endsWith('.pdf') ? (
                          <a href={imageUrl(r.path)!} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm">
                            View PDF Receipt
                          </a>
                        ) : (
                          <a href={imageUrl(r.path)!} target="_blank" rel="noopener noreferrer">
                            <img
                              src={imageUrl(r.path)!}
                              alt="Uploaded payment receipt"
                              className="w-16 h-16 object-cover border border-ink/10"
                            />
                          </a>
                        )}
                        <span className="text-xs text-ink/50">
                          Uploaded {new Date(r.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-ink/50">Made another payment? Upload another receipt below.</p>
                  </div>
                ) : (
                  <p className="text-sm text-ink/60 mb-3">
                    Already made payment? Upload a photo or PDF of your receipt so we can verify it.
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="flex-1 border border-ink/15 px-3 py-2 bg-white/60 text-sm focus-ring"
                  />
                  <button
                    onClick={handleReceiptUpload}
                    disabled={!receiptFile || uploadingReceipt}
                    type="button"
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {uploadingReceipt ? 'Uploading…' : 'Upload Receipt'}
                  </button>
                </div>
                {receiptError && <p className="text-red-700 text-sm mt-2">{receiptError}</p>}
                {receiptSuccess && <p className="text-green-700 text-sm mt-2">Receipt uploaded successfully.</p>}
              </div>
            </div>
          )}

          <div className="text-sm text-ink/60 mb-2">Services requested:</div>
          <div className="flex flex-wrap gap-2 mb-6">
            {result.selected_services.map((s) => (
              <span key={s} className="text-xs bg-stoneDark px-3 py-1">{s}</span>
            ))}
          </div>

          <div className="text-xs text-ink/40">
            Submitted {new Date(result.submitted_at).toLocaleDateString()} &middot; Last updated{' '}
            {new Date(result.last_updated_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
