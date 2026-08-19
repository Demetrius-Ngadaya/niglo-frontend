import { api } from '@/lib/api';
import RentalsGrid from './RentalsGrid';

type Item = { id: number; name: string; slug: string; description?: string | null; image_path?: string | null; price_per_day?: string | null };
type Category = { id: number; name: string; items: Item[] };

async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await api.get('/rental-equipment-categories');
    return data;
  } catch {
    return [];
  }
}

export default async function RentalsPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Equipment for hire</div>
      <h1 className="font-display text-4xl md:text-5xl mb-4">Rentals</h1>
      <p className="text-ink/70 dark:text-stone/70 max-w-xl mb-16">
        Cameras, drones and catering equipment available for your event. Click a photo to see
        it up close, or add items to build your equipment request — select as many as you need.
      </p>

      <RentalsGrid categories={categories} />

      {categories.length === 0 && <p className="text-ink/50 dark:text-stone/60">No rental equipment listed yet.</p>}
    </div>
  );
}
