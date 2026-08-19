import Link from 'next/link';
import Image from 'next/image';
import { api, imageUrl, ServiceCategory, PortfolioProject } from '@/lib/api';

async function getCategories(): Promise<ServiceCategory[]> {
  try {
    const { data } = await api.get('/service-categories');
    return data;
  } catch {
    return [];
  }
}

async function getFeaturedProjects(): Promise<PortfolioProject[]> {
  try {
    const { data } = await api.get('/portfolio');
    return data.slice(0, 3);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, projects] = await Promise.all([getCategories(), getFeaturedProjects()]);

  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="eyebrow mb-5">Interior &middot; Plumbing &middot; Events &middot; Rentals &middot; Delivery</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.98] max-w-3xl">
          We design. We build.
          <br />
          We create. <span className="text-brass">We deliver.</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-ink/70">
          NIGLOY is a complete solution — one team for interior finishing, plumbing,
          event production, catering, rentals and delivery. Tell us what you&apos;re
          planning and we&apos;ll handle it end to end.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/start-a-project" className="btn-primary">Start Your Project</Link>
          <Link href="/services" className="btn-outline">Explore Services</Link>
        </div>
      </section>

      <div className="seam max-w-6xl mx-auto" />

      {/* What are you looking for today */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="eyebrow mb-3">Where do we start</div>
        <h2 className="font-display text-3xl md:text-4xl mb-10">What are you looking for today?</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories.length ? categories : PLACEHOLDER_CATEGORIES).map((cat, i) => (
            <Link
              key={cat.slug ?? i}
              href={`/services#${cat.slug ?? ''}`}
              className="group relative border border-ink/10 bg-white/40 hover:border-brass p-6 flex flex-col justify-between min-h-[160px] transition-colors"
            >
              <span className="text-xs text-concrete font-mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-display text-xl mt-6 group-hover:text-brass transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="seam max-w-6xl mx-auto" />

      {/* Featured portfolio */}
      {projects.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="eyebrow mb-3">Recent work</div>
              <h2 className="font-display text-3xl md:text-4xl">From the portfolio</h2>
            </div>
            <Link href="/portfolio" className="hidden sm:inline text-sm font-medium hover:text-brass">
              View all projects &rarr;
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Link key={p.slug} href={`/portfolio/${p.slug}`} className="group block">
                <div className="relative aspect-[4/3] bg-stoneDark overflow-hidden mb-4">
                  {p.cover_image_path && (
                    <Image
                      src={imageUrl(p.cover_image_path)!}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="text-xs text-brass font-semibold uppercase tracking-wide mb-1">
                  {p.category?.name}
                </div>
                <div className="font-display text-lg group-hover:text-brass transition-colors">
                  {p.title}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="bg-ink text-stone mt-8">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">Have a project in mind?</h2>
          <p className="text-stone/70 max-w-lg mx-auto mb-8">
            Whether it&apos;s a full home renovation or a one-day event, tell us what you need
            and we&apos;ll put together a quotation.
          </p>
          <Link href="/start-a-project" className="btn-primary">Start Your Project</Link>
        </div>
      </section>
    </>
  );
}

const PLACEHOLDER_CATEGORIES = [
  { slug: '', name: 'Interior Design & Finishing' },
  { slug: '', name: 'Plumbing Services' },
  { slug: '', name: 'Photography & Video Production' },
  { slug: '', name: 'Catering Services' },
  { slug: '', name: 'Delivery & Distribution' },
  { slug: '', name: 'Equipment Rental' },
];
