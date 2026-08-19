'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-brass bg-brass/10 p-8 text-center">
        <p className="font-display text-xl">Message sent — we&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="name" required placeholder="Your name" className="w-full border border-ink/15 dark:border-stone/15 px-4 py-3 bg-white/60 dark:bg-white/5 focus-ring" />
      <input name="email" type="email" required placeholder="Email" className="w-full border border-ink/15 dark:border-stone/15 px-4 py-3 bg-white/60 dark:bg-white/5 focus-ring" />
      <input name="phone" placeholder="Phone (optional)" className="w-full border border-ink/15 dark:border-stone/15 px-4 py-3 bg-white/60 dark:bg-white/5 focus-ring" />
      <input name="subject" placeholder="Subject" className="w-full border border-ink/15 dark:border-stone/15 px-4 py-3 bg-white/60 dark:bg-white/5 focus-ring" />
      <textarea name="message" required rows={5} placeholder="Your message" className="w-full border border-ink/15 dark:border-stone/15 px-4 py-3 bg-white/60 dark:bg-white/5 focus-ring" />
      {status === 'error' && <p className="text-red-700 text-sm">Something went wrong — please try again.</p>}
      <button type="submit" disabled={status === 'sending'} className="btn-primary disabled:opacity-50">
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
