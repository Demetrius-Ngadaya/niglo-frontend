'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/rentals', label: 'Rentals' },
  { href: '/blog', label: 'Insights' },
  { href: '/track-request', label: 'Track Request' },
  { href: '/contact', label: 'Contact' },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-stone/90 dark:bg-ink/90 backdrop-blur border-b border-ink/10 dark:border-stone/10">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMenuOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="NIGLOY COMPANY"
            className="h-10 w-10 rounded-full object-cover border border-ink/10 dark:border-stone/20"
          />
          <span className="font-display text-2xl tracking-tight">
            NIGLOY<span className="text-brass">.</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brass transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden md:flex" />
          <Link href="/start-a-project" className="btn-primary text-sm hidden md:inline-flex">
            Start a Project
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden w-10 h-10 flex items-center justify-center"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink/10 dark:border-stone/10 bg-stone dark:bg-ink">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-medium border-b border-ink/5 dark:border-stone/5 hover:text-brass transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-ink/60 dark:text-stone/60">Theme</span>
              <ThemeToggle />
            </div>
            <Link
              href="/start-a-project"
              onClick={() => setMenuOpen(false)}
              className="btn-primary text-sm justify-center mt-4"
            >
              Start a Project
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
