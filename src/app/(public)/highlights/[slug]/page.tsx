import { notFound } from 'next/navigation';
import { api, imageUrl } from '@/lib/api';

type HeroSlide = { id: number; title: string; slug: string; image_path: string; description?: string | null };

async function getSlide(slug: string): Promise<HeroSlide | null> {
  try {
    const { data } = await api.get(`/hero-slides/${slug}`);
    return data;
  } catch (err) {
    console.error('Failed to load highlight:', err);
    return null;
  }
}

export default async function HighlightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slide = await getSlide(slug);
  if (!slide) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="w-full flex items-center justify-center mb-10 bg-gray-100 dark:bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl(slide.image_path)!} alt={slide.title} className="max-w-full max-h-[70vh] object-contain" />
      </div>

      <h1 className="font-display text-3xl md:text-4xl mb-6">{slide.title}</h1>

      {slide.description && (
        <p className="text-ink/70 dark:text-stone/70 text-lg leading-relaxed whitespace-pre-line">
          {slide.description}
        </p>
      )}
    </div>
  );
}
