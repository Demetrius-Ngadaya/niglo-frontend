import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { api, imageUrl } from '@/lib/api';
import Reveal from '@/components/Reveal';
import HoverCard from '@/components/HoverCard';

type Album = { id: number; title: string; slug: string; cover_image_path?: string | null; images_count?: number };

async function getAlbums(): Promise<Album[]> {
  try {
    const { data } = await api.get('/gallery');
    return data;
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const albums = await getAlbums();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <Reveal>
        <div className="eyebrow mb-3">See our work</div>
        <h1 className="font-display text-4xl md:text-5xl mb-16">Gallery</h1>
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album, i) => (
          <Reveal key={album.slug} delay={(i % 6) * 0.08}>
            <HoverCard>
              <Link href={`/gallery/${album.slug}`} className="group block">
                <div className="relative aspect-square bg-stoneDark dark:bg-white/5 mb-3 overflow-hidden">
                  {album.cover_image_path && (
                    <Image src={imageUrl(album.cover_image_path)!} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                </div>
                <div className="font-display text-lg group-hover:text-brass transition-colors">{album.title}</div>
                {typeof album.images_count === 'number' && (
                  <div className="text-sm text-brass font-medium group-hover:underline flex items-center gap-1">
                    View All {album.images_count} Photo{album.images_count === 1 ? '' : 's'}
                    <ChevronRight size={14} />
                  </div>
                )}
              </Link>
            </HoverCard>
          </Reveal>
        ))}
        {albums.length === 0 && <p className="text-ink/50 dark:text-stone/60">No albums published yet.</p>}
      </div>
    </div>
  );
}
