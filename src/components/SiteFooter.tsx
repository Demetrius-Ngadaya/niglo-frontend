import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-stone mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-10 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl mb-3">NIGLOY<span className="text-brass">.</span></div>
          <p className="text-sm text-stone/70">
            Interior finishing, plumbing, event production, catering, delivery and equipment
            rental — one company, one team.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-4">Services</div>
          <ul className="space-y-2 text-sm text-stone/80">
            <li><Link href="/services" className="hover:text-brass">Interior &amp; Finishing</Link></li>
            <li><Link href="/services" className="hover:text-brass">Plumbing</Link></li>
            <li><Link href="/services" className="hover:text-brass">Photo &amp; Video</Link></li>
            <li><Link href="/services" className="hover:text-brass">Catering</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Company</div>
          <ul className="space-y-2 text-sm text-stone/80">
            <li><Link href="/portfolio" className="hover:text-brass">Portfolio</Link></li>
            <li><Link href="/gallery" className="hover:text-brass">Gallery</Link></li>
            <li><Link href="/blog" className="hover:text-brass">Insights</Link></li>
            <li><Link href="/contact" className="hover:text-brass">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Get a Quote</div>
          <p className="text-sm text-stone/70 mb-4">Tell us what you're planning — we'll respond with a quotation.</p>
          <Link href="/start-a-project" className="btn-outline border-stone/30 text-stone hover:border-brass text-sm">
            Start a Project
          </Link>
        </div>
      </div>
      <div className="seam opacity-30" />
      <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-stone/50">
        &copy; {new Date().getFullYear()} NIGLOY COMPANY. All rights reserved.
      </div>
    </footer>
  );
}
