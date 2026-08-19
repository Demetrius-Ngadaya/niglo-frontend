import Image from 'next/image';
import { api, imageUrl } from '@/lib/api';

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
      <div className="eyebrow mb-3">See our work</div>
      <h1 className="font-display text-4xl md:text-5xl mb-16">Gallery</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div key={album.slug} className="block">
            <div className="relative aspect-square bg-stoneDark dark:bg-white/5 mb-3 overflow-hidden">
              {album.cover_image_path && (
                <Image src={imageUrl(album.cover_image_path)!} alt={album.title} fill className="object-cover" />
              )}
            </div>
            <div className="font-display text-lg">{album.title}</div>
            {typeof album.images_count === 'number' && (
              <div className="text-sm text-ink/50 dark:text-stone/60">{album.images_count} photos</div>
            )}
          </div>
        ))}
        {albums.length === 0 && <p className="text-ink/50 dark:text-stone/60">No albums published yet.</p>}
      </div>
    </div>
  );
}
