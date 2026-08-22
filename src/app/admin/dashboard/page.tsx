'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminFetch, adminToken } from '@/lib/api';
import { AdminStatsSkeleton } from '@/components/AdminSkeleton';

type Stats = {
  services: number;
  portfolio_projects: number;
  blog_posts: number;
  team_members: number;
  quotation_requests_new: number;
  quotation_requests_total: number;
  rental_requests_new: number;
  rental_requests_total: number;
  unread_messages: number;
};

const CARDS: { key: keyof Stats; label: string; href?: string }[] = [
  { key: 'quotation_requests_new', label: 'New Quotation Requests', href: '/admin/quotation-requests?status=new' },
  { key: 'quotation_requests_total', label: 'Total Quotation Requests', href: '/admin/quotation-requests' },
  { key: 'rental_requests_new', label: 'New Equipment Requests', href: '/admin/rental-requests?status=new' },
  { key: 'rental_requests_total', label: 'Total Equipment Requests', href: '/admin/rental-requests' },
  { key: 'unread_messages', label: 'Unread Messages', href: '/admin/contact-messages' },
  { key: 'services', label: 'Services', href: '/admin/services' },
  { key: 'portfolio_projects', label: 'Portfolio Projects', href: '/admin/portfolio' },
  { key: 'blog_posts', label: 'Blog Posts', href: '/admin/blog' },
  { key: 'team_members', label: 'Team Members', href: '/admin/team' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken()) {
      router.push('/admin/login');
      return;
    }

    adminFetch('/admin/dashboard')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [router]);

  return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="eyebrow mb-2">Admin</div>
        <h1 className="font-display text-3xl mb-12">Dashboard</h1>

        {error && <p className="text-red-700 text-sm mb-6">{error}</p>}

        {!stats && !error && <AdminStatsSkeleton count={9} />}

        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CARDS.map((c) => {
              const card = (
                <div className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-6 h-full hover:border-brass transition-colors">
                  <div className="text-3xl font-display text-brass mb-1">{stats[c.key]}</div>
                  <div className="text-sm text-ink/60 dark:text-stone/60">{c.label}</div>
                </div>
              );
              return c.href ? (
                <Link key={c.key} href={c.href}>{card}</Link>
              ) : (
                <div key={c.key}>{card}</div>
              );
            })}
          </div>
        )}

        <p className="text-sm text-ink/50 dark:text-stone/60 mt-12">
          All admin modules are now built: Quotation Requests, Rental Requests, Services,
          Service Sliders, Portfolio, Rentals, Gallery, Team, Blog, Testimonials, and
          Contact Messages.
        </p>
      </div>

  );
}
