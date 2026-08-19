'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, setAdminToken } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Invalid credentials.');
      }

      const data = await res.json();
      setAdminToken(data.token);
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-ink">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-3 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="NIGLOY COMPANY" className="h-10 w-auto" />
          <div className="font-display text-2xl text-stone">NIGLOY<span className="text-brass">.</span></div>
        </div>
        <p className="text-sm text-stone/60 mb-8">Sign in to manage the site.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" required placeholder="Email" className="w-full border border-stone/20 px-4 py-3 bg-stone/10 text-stone placeholder:text-stone/40 focus-ring" />
          <input name="password" type="password" required placeholder="Password" className="w-full border border-stone/20 px-4 py-3 bg-stone/10 text-stone placeholder:text-stone/40 focus-ring" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
