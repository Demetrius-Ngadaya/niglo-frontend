'use client';

import { useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

const PROJECT_TYPES = [
  'New house', 'House renovation', 'Office', 'Shop', 'Restaurant', 'Hotel',
  'Wedding', 'Birthday', 'Corporate event', 'Other',
];

const SERVICES = [
  'Interior Design', 'Tiles', 'Gypsum & TV Showcase', 'Custom Furniture',
  'Plumbing', 'Photography', 'Videography', 'Catering', 'Delivery', 'Equipment Rental',
];

const BUDGETS = ['Under 2M TZS', '2M - 10M TZS', '10M - 50M TZS', 'Over 50M TZS', 'Not sure yet'];

export default function StartProjectForm() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<string[]>([]);

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (services.length === 0) {
      setError('Select at least one service.');
      return;
    }

    const form = new FormData(e.currentTarget);
    const payload = {
      full_name: form.get('full_name'),
      email: form.get('email') || null,
      phone: form.get('phone'),
      project_type: form.get('project_type'),
      selected_services: services,
      location: form.get('location') || null,
      budget_range: form.get('budget_range') || null,
      preferred_start_date: form.get('preferred_start_date') || null,
      details: form.get('details') || null,
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotation-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Something went wrong. Please try again.');
      }

      const data = await res.json();
      setSubmitted(data.reference_no);
      (e.target as HTMLFormElement).reset();
      setServices([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-brass bg-brass/10 p-10 text-center">
        <div className="eyebrow mb-3">Request received</div>
        <h2 className="font-display text-2xl mb-3">Thank you — we&apos;re on it.</h2>
        <p className="text-ink/70 mb-6">
          Your reference number is <span className="font-mono font-semibold text-ink">{submitted}</span>.
          Save it — you can check your request&apos;s status anytime using this reference
          number and your phone number. Our team will also contact you directly with a
          quotation.
        </p>
        <Link href="/track-request" className="btn-outline">
          Track Your Request
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div>
        <div className="eyebrow mb-4">1. What are you planning?</div>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map((t) => (
            <label key={t} className="cursor-pointer">
              <input type="radio" name="project_type" value={t} required className="peer sr-only" />
              <span className="inline-block px-4 py-2 text-sm border border-ink/15 peer-checked:bg-ink peer-checked:text-stone peer-checked:border-ink transition-colors">
                {t}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="eyebrow mb-4">2. What do you need?</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {SERVICES.map((s) => (
            <label key={s} className="flex items-center gap-3 border border-ink/15 px-4 py-3 cursor-pointer hover:border-brass">
              <input
                type="checkbox"
                checked={services.includes(s)}
                onChange={() => toggleService(s)}
                className="accent-brass w-4 h-4"
              />
              <span className="text-sm">{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="eyebrow mb-4">3. Your details</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <input name="full_name" required placeholder="Full name" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
          <input name="phone" required placeholder="Phone number" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
          <input name="email" type="email" placeholder="Email (optional)" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
          <input name="location" placeholder="Location / area" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
          <select name="budget_range" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring">
            <option value="">Budget range (optional)</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input name="preferred_start_date" type="date" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
        </div>
        <textarea
          name="details"
          rows={4}
          placeholder="Tell us more about the project (dimensions, dates, style, anything useful)"
          className="mt-4 w-full border border-ink/15 px-4 py-3 bg-white/60 focus-ring"
        />
      </div>

      {error && <p className="text-red-700 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto justify-center disabled:opacity-50">
        {loading ? 'Sending…' : 'Request Quotation'}
      </button>
    </form>
  );
}
