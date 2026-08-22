'use client';

import { useState } from 'react';
import Image from 'next/image';
import { imageUrl } from '@/lib/api';
import ImageLightbox from '@/components/ImageLightbox';
import { ZoomIn } from 'lucide-react';

type AlbumImage = { id: number; image_path: string; caption?: string | null };
type Album = { title: string; cover_image_path?: string | null; images: AlbumImage[] };

export default function GalleryAlbumDetail({ album }: { album: Album }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Cover photo joins the same navigable sequence as the rest of the album's
  // photos — clicking any one of them (cover included) lets you arrow through
  // every photo in the album without closing and reopening the lightbox.
  const allPhotos = [
    ...(album.cover_image_path ? [{ id: -1, image_path: album.cover_image_path, caption: album.title }] : []),
    ...album.images,
  ];

  if (allPhotos.length === 0) {
    return <p className="text-ink/50 dark:text-stone/60">No photos in this album yet.</p>;
  }

  return (
    <>
      {album.cover_image_path && (
        <button
          onClick={() => setLightboxIndex(0)}
          className="relative aspect-video w-full bg-stoneDark dark:bg-white/5 mb-8 block group overflow-hidden"
        >
          <Image src={imageUrl(album.cover_image_path)!} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="text-stone" size={32} />
          </span>
        </button>
      )}

      {album.images.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {album.images.map((img) => {
            const photoIndex = allPhotos.findIndex((p) => p.id === img.id);
            return (
              <button
                key={img.id}
                onClick={() => setLightboxIndex(photoIndex)}
                className="relative aspect-square bg-stoneDark dark:bg-white/5 block group overflow-hidden"
              >
                <Image src={imageUrl(img.image_path)!} alt={img.caption || album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="text-stone" size={28} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={allPhotos}
          startIndex={lightboxIndex}
          title={album.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
