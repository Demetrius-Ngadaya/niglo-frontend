import Link from 'next/link';
import Image from 'next/image';
import { api, imageUrl, PortfolioProject } from '@/lib/api';

async function getProjects(): Promise<PortfolioProject[]> {
  try {
    const { data } = await api.get('/portfolio');
    return data;
  } catch {
    return [];
  }
}

export default async function PortfolioPage() {
  const projects = await getProjects();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Completed work</div>
      <h1 className="font-display text-4xl md:text-5xl mb-16">Portfolio</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {projects.map((p) => (
          <Link key={p.slug} href={`/portfolio/${p.slug}`} className="group block">
            <div className="relative aspect-[4/3] bg-stoneDark overflow-hidden mb-4">
              {p.cover_image_path && (
                <Image src={imageUrl(p.cover_image_path)!} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
            </div>
            <div className="text-xs text-brass font-semibold uppercase tracking-wide mb-1">{p.category?.name}</div>
            <div className="font-display text-lg group-hover:text-brass transition-colors">{p.title}</div>
            {p.location && <div className="text-sm text-ink/50 mt-1">{p.location}</div>}
          </Link>
        ))}
        {projects.length === 0 && <p className="text-ink/50">No projects published yet.</p>}
      </div>
    </div>
  );
}
