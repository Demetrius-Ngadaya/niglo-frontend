import { notFound } from 'next/navigation';
import { api, PortfolioProject } from '@/lib/api';
import PortfolioDetail from './PortfolioDetail';

async function getProject(slug: string): Promise<PortfolioProject | null> {
  try {
    const { data } = await api.get(`/portfolio/${slug}`);
    return data;
  } catch (err) {
    console.error('Failed to load portfolio project:', err);
    return null;
  }
}

export default async function PortfolioDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-xs text-brass font-semibold uppercase tracking-wide mb-3">
        {project.category?.name}
      </div>
      <h1 className="font-display text-4xl md:text-5xl mb-6">{project.title}</h1>

      <div className="flex flex-wrap gap-6 text-sm text-ink/60 dark:text-stone/60 mb-10">
        {project.location && <span>{project.location}</span>}
        {project.completed_on && <span>Completed {project.completed_on}</span>}
        {project.client_name && <span>Client: {project.client_name}</span>}
      </div>

      <PortfolioDetail project={project} />
    </div>
  );
}
