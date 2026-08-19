import Link from 'next/link';
import Image from 'next/image';
import { api, imageUrl, PortfolioProject, TeamMember, ServiceCategory } from '@/lib/api';
import ServicesGrid from './services/ServicesGrid';
import RentalsGrid from './rentals/RentalsGrid';
import TeamSection from './TeamSection';
import HomeHeroSlider from './HomeHeroSlider';

type RentalItem = { id: number; name: string; slug: string; description?: string | null; image_path?: string | null; price_per_day?: string | null };
type RentalCategory = { id: number; name: string; items: RentalItem[] };
type HeroSlide = { id: number; title: string; slug: string; image_path: string; description?: string | null };

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

async function getTeam(): Promise<TeamMember[]> {
  try {
    const { data } = await api.get('/team');
    return data;
  } catch {
    return [];
  }
}

async function getRentalCategories(): Promise<RentalCategory[]> {
  try {
    const { data } = await api.get('/rental-equipment-categories');
    return data;
  } catch {
    return [];
  }
}

async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data } = await api.get('/hero-slides');
    return data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, projects, team, rentalCategories, heroSlides] = await Promise.all([
    getCategories(),
    getFeaturedProjects(),
    getTeam(),
    getRentalCategories(),
    getHeroSlides(),
  ]);

  return (
    <>
      <HomeHeroSlider slides={heroSlides} />

      {/* Hero text */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-14">
        <div className="eyebrow mb-4">Interior &middot; Plumbing &middot; Events &middot; Rentals &middot; Delivery</div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight max-w-2xl">
          We design. We build. We create. <span className="text-brass">We deliver.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base sm:text-lg text-ink/70 dark:text-stone/70">
          NIGLOY is a complete solution — one team for interior finishing, plumbing,
          event production, catering, rentals and delivery. Tell us what you&apos;re
          planning and we&apos;ll handle it end to end.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/start-a-project" className="btn-primary">Start Your Project</Link>
          <Link href="/services" className="btn-outline">Explore Services</Link>
        </div>
      </section>

      <div className="seam max-w-6xl mx-auto" />

      {/* What are you looking for today — reuses the same category/service cards from /services */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="eyebrow mb-3">Where do we start</div>
            <h2 className="font-display text-3xl md:text-4xl">What are you looking for today?</h2>
          </div>
          <Link href="/services" className="text-sm font-medium hover:text-brass whitespace-nowrap">
            View all services &rarr;
          </Link>
        </div>

        {categories.length > 0 ? (
          <ServicesGrid categories={categories} />
        ) : (
          <p className="text-ink/50 dark:text-stone/60">
            No services found — make sure the backend is running and seeded.
          </p>
        )}
      </section>

      <div className="seam max-w-6xl mx-auto" />

      {/* Rentals — reuses the exact same grid, zoom and "Add to Request" cart from /rentals */}
      {rentalCategories.length > 0 && (
        <>
          <section className="max-w-6xl mx-auto px-6 py-20">
            <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
              <div>
                <div className="eyebrow mb-3">Equipment for hire</div>
                <h2 className="font-display text-3xl md:text-4xl">Rentals</h2>
              </div>
              <Link href="/rentals" className="text-sm font-medium hover:text-brass whitespace-nowrap">
                View all rentals &rarr;
              </Link>
            </div>

            <RentalsGrid categories={rentalCategories} />
          </section>

          <div className="seam max-w-6xl mx-auto" />
        </>
      )}

      {/* Team */}
      <TeamSection members={team} />

      {team.length > 0 && <div className="seam max-w-6xl mx-auto" />}

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
                <div className="relative aspect-[4/3] bg-stoneDark dark:bg-white/5 overflow-hidden mb-4">
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
