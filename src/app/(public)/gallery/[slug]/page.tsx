import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import GalleryAlbumDetail from './GalleryAlbumDetail';

type AlbumImage = { id: number; image_path: string; caption?: string | null };
type Album = { id: number; title: string; slug: string; description?: string | null; cover_image_path?: string | null; images: AlbumImage[] };

async function getAlbum(slug: string): Promise<Album | null> {
  try {
    const { data } = await api.get(`/gallery/${slug}`);
    return data;
  } catch (err) {
    console.error('Failed to load gallery album:', err);
    return null;
  }
}

export default async function GalleryAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = await getAlbum(slug);
  if (!album) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Gallery</div>
      <h1 className="font-display text-4xl md:text-5xl mb-4">{album.title}</h1>
      {album.description && (
        <p className="text-ink/70 dark:text-stone/70 max-w-2xl mb-10">{album.description}</p>
      )}

      <GalleryAlbumDetail album={album} />
    </div>
  );
}
