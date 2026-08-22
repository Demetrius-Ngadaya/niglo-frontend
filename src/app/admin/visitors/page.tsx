'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch, adminToken } from '@/lib/api';

type Stats = {
  today: number;
  this_week: number;
  this_month: number;
  all_time: number;
  top_countries: { country: string; visits: number }[];
  top_cities: { city: string; country: string; visits: number }[];
  recent: { id: number; country?: string | null; city?: string | null; landing_page?: string | null; created_at: string }[];
};

export default function AdminVisitorsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }
    adminFetch('/admin/visitor-stats').then(setStats).catch((err) => setError(err.message));
  }, [router]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">Admin</div>
      <h1 className="font-display text-3xl mb-2">Visitors</h1>
      <p className="text-sm text-ink/50 dark:text-stone/50 mb-10 max-w-lg">
        Counts unique visits (one per browser session). Location is estimated from the
        visitor&apos;s IP address — no location permission is ever requested from visitors.
      </p>

      {error && <p className="text-red-700 dark:text-red-400 text-sm mb-6">{error}</p>}

      {stats && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Today', value: stats.today },
              { label: 'This Week', value: stats.this_week },
              { label: 'This Month', value: stats.this_month },
              { label: 'All Time', value: stats.all_time },
            ].map((c) => (
              <div key={c.label} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-6">
                <div className="text-3xl font-display text-brass mb-1">{c.value}</div>
                <div className="text-sm text-ink/60 dark:text-stone/60">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="font-display text-lg mb-4">Top Countries</h2>
              <div className="space-y-2">
                {stats.top_countries.map((c) => (
                  <div key={c.country} className="flex justify-between text-sm border-b border-ink/5 dark:border-stone/5 pb-2">
                    <span>{c.country}</span>
                    <span className="text-brass font-medium">{c.visits}</span>
                  </div>
                ))}
                {stats.top_countries.length === 0 && <p className="text-sm text-ink/40 dark:text-stone/40">No data yet.</p>}
              </div>
            </div>
            <div>
              <h2 className="font-display text-lg mb-4">Top Cities</h2>
              <div className="space-y-2">
                {stats.top_cities.map((c, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-ink/5 dark:border-stone/5 pb-2">
                    <span>{c.city}, {c.country}</span>
                    <span className="text-brass font-medium">{c.visits}</span>
                  </div>
                ))}
                {stats.top_cities.length === 0 && <p className="text-sm text-ink/40 dark:text-stone/40">No data yet.</p>}
              </div>
            </div>
          </div>

          <h2 className="font-display text-lg mb-4">Recent Visits</h2>
          <div className="space-y-1">
            {stats.recent.map((v) => (
              <div key={v.id} className="flex justify-between text-sm border-b border-ink/5 dark:border-stone/5 py-2">
                <span>{v.city ? `${v.city}, ${v.country}` : v.country || 'Unknown location'}</span>
                <span className="text-ink/50 dark:text-stone/50">{v.landing_page}</span>
                <span className="text-ink/40 dark:text-stone/40">{new Date(v.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
