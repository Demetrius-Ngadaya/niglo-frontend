import { api, ServiceCategory } from '@/lib/api';
import ServiceHeroSlider from '@/components/ServiceHeroSlider';
import ServicesGrid from './ServicesGrid';

type Slide = { id: number; image_path: string; title?: string | null };

async function getCategories(): Promise<ServiceCategory[]> {
  try {
    const { data } = await api.get('/service-categories');
    return data;
  } catch {
    return [];
  }
}

async function getSliders(): Promise<Slide[]> {
  try {
    const { data } = await api.get('/service-sliders');
    return data;
  } catch {
    return [];
  }
}

export default async function ServicesPage() {
  const [categories, slides] = await Promise.all([getCategories(), getSliders()]);

  return (
    <div>
      <ServiceHeroSlider slides={slides} />

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="eyebrow mb-3">What we do</div>
        <h1 className="font-display text-4xl md:text-5xl mb-4">Our Services</h1>
        <p className="text-ink/70 dark:text-stone/70 max-w-xl mb-16">
          Six areas, one team. Pick what you need or bundle several into a single project.
        </p>

        <ServicesGrid categories={categories} />
      </div>
    </div>
  );
}
