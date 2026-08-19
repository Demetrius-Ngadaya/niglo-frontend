'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminFetch, clearAdminToken } from '@/lib/api';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/quotation-requests', label: 'Quotation Requests' },
  { href: '/admin/rental-requests', label: 'Rental Requests' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/service-sliders', label: 'Service Sliders' },
  { href: '/admin/portfolio', label: 'Portfolio' },
  { href: '/admin/rentals', label: 'Rentals' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/contact-messages', label: 'Messages' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    adminFetch('/admin/logout', { method: 'POST' }).finally(() => {
      clearAdminToken();
      router.push('/admin/login');
    });
  }

  return (
    <div className="border-b border-ink/10 bg-white/40">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4">
        <nav className="flex gap-6 overflow-x-auto whitespace-nowrap">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                pathname === link.href
                  ? 'border-brass text-brass'
                  : 'border-transparent text-ink/60 hover:text-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="text-sm text-ink/60 hover:text-brass">
          Log Out
        </button>
      </div>
    </div>
  );
}
