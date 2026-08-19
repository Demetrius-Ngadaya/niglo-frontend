'use client';

import { useState } from 'react';
import Image from 'next/image';
import { imageUrl, PortfolioProject } from '@/lib/api';
import ImageLightbox from '@/components/ImageLightbox';
import { ZoomIn } from 'lucide-react';

export default function PortfolioDetail({ project }: { project: PortfolioProject }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // One combined, ordered list so the lightbox can navigate across all of a
  // project's photos — cover, before, after, then the extra gallery shots.
  const allImages = [
    project.cover_image_path && { image_path: project.cover_image_path, caption: project.title },
    project.before_image_path && { image_path: project.before_image_path, caption: 'Before' },
    project.after_image_path && { image_path: project.after_image_path, caption: 'After' },
    ...(project.images || []).map((img) => ({ image_path: img.image_path, caption: img.caption })),
  ].filter(Boolean) as { image_path: string; caption?: string | null }[];

  function openAt(imagePath: string) {
    const idx = allImages.findIndex((img) => img.image_path === imagePath);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }

  return (
    <>
      {project.cover_image_path && (
        <button
          onClick={() => openAt(project.cover_image_path!)}
          className="relative aspect-video bg-stoneDark dark:bg-white/5 mb-10 w-full block group overflow-hidden"
        >
          <Image src={imageUrl(project.cover_image_path)!} alt={project.title} fill className="object-cover" />
          <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="text-stone" size={32} />
          </span>
        </button>
      )}

      {(project.before_image_path || project.after_image_path) && (
        <div className="grid grid-cols-2 gap-4 mb-10">
          {project.before_image_path && (
            <div>
              <div className="eyebrow mb-2">Before</div>
              <button
                onClick={() => openAt(project.before_image_path!)}
                className="relative aspect-square bg-stoneDark dark:bg-white/5 w-full block group overflow-hidden"
              >
                <Image src={imageUrl(project.before_image_path)!} alt="Before" fill className="object-cover" />
                <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="text-stone" size={28} />
                </span>
              </button>
            </div>
          )}
          {project.after_image_path && (
            <div>
              <div className="eyebrow mb-2">After</div>
              <button
                onClick={() => openAt(project.after_image_path!)}
                className="relative aspect-square bg-stoneDark dark:bg-white/5 w-full block group overflow-hidden"
              >
                <Image src={imageUrl(project.after_image_path)!} alt="After" fill className="object-cover" />
                <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="text-stone" size={28} />
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {project.description && (
        <div className="prose max-w-none text-ink/80 dark:text-stone/80" dangerouslySetInnerHTML={{ __html: project.description }} />
      )}

      {project.images && project.images.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4 mt-12">
          {project.images.map((img) => (
            <button
              key={img.id}
              onClick={() => openAt(img.image_path)}
              className="relative aspect-square bg-stoneDark dark:bg-white/5 block group overflow-hidden"
            >
              <Image src={imageUrl(img.image_path)!} alt={img.caption || project.title} fill className="object-cover" />
              <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="text-stone" size={24} />
              </span>
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={allImages}
          startIndex={lightboxIndex}
          title={project.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
