'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminFetch, clearAdminToken } from '@/lib/api';
import { LogOut, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: '',
    links: [{ href: '/admin/dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Requests',
    links: [
      { href: '/admin/quotation-requests', label: 'Quotation Requests' },
      { href: '/admin/rental-requests', label: 'Rental Requests' },
      { href: '/admin/contact-messages', label: 'Contact Messages' },
    ],
  },
  {
    label: 'Content',
    links: [
      { href: '/admin/hero-slides', label: 'Hero Slides' },
      { href: '/admin/services', label: 'Services' },
      { href: '/admin/service-sliders', label: 'Service Sliders' },
      { href: '/admin/portfolio', label: 'Portfolio' },
      { href: '/admin/rentals', label: 'Rental Equipment' },
      { href: '/admin/gallery', label: 'Gallery' },
      { href: '/admin/team', label: 'Team' },
      { href: '/admin/blog', label: 'Blog' },
      { href: '/admin/testimonials', label: 'Testimonials' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    adminFetch('/admin/logout', { method: 'POST' }).finally(() => {
      clearAdminToken();
      router.push('/admin/login');
    });
  }

  const sidebarContent = (
    <>
      <div className="px-6 py-6 border-b border-stone/10 flex flex-col items-center text-center">
        <Link href="/admin/dashboard" className="flex flex-col items-center gap-2" onClick={() => setMobileOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="NIGLOY COMPANY"
            className="h-14 w-14 rounded-full object-cover border-2 border-brass/40"
          />
          <span className="font-display text-lg tracking-tight">
            NIGLOY<span className="text-brass">.</span>
          </span>
        </Link>
        <div className="text-xs text-stone/40 mt-1">Admin Panel</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {GROUPS.map((group, i) => (
          <div key={i} className="mb-5">
            {group.label && (
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone/40">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 text-sm rounded transition-colors ${
                      active
                        ? 'bg-brass/20 text-brass font-medium'
                        : 'text-stone/70 hover:bg-stone/10 hover:text-stone'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-stone/10 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-stone/60">Theme</span>
          <ThemeToggle className="text-stone" />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone/70 hover:bg-stone/10 hover:text-stone rounded transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar with hamburger — only visible below md */}
      <div className="md:hidden sticky top-0 z-40 bg-ink text-stone flex items-center justify-between px-4 h-16 border-b border-stone/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="NIGLOY COMPANY" className="h-8 w-8 rounded-full object-cover border border-brass/40" />
          <span className="font-display text-base">NIGLOY<span className="text-brass">.</span> Admin</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar — always visible, participates in the layout's flex row */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-ink text-stone flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer — off-canvas, slides in over a backdrop when opened */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[80vw] bg-ink text-stone flex flex-col h-full">
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            {sidebarContent}
          </div>
          <button
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}
    </>
  );
}
