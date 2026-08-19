import Link from 'next/link';

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
  return (
    <header className="sticky top-0 z-40 bg-stone/90 backdrop-blur border-b border-ink/10">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight">
          NIGLOY<span className="text-brass">.</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brass transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/start-a-project" className="btn-primary text-sm">
          Start a Project
        </Link>
      </div>
    </header>
  );
}
