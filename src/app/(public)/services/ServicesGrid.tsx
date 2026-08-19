'use client';

import { useState } from 'react';
import Image from 'next/image';
import { imageUrl, ServiceCategory, Service } from '@/lib/api';
import ImageLightbox from '@/components/ImageLightbox';
import { Images } from 'lucide-react';

export default function ServicesGrid({ categories }: { categories: ServiceCategory[] }) {
  const [lightbox, setLightbox] = useState<{ service: Service; index: number } | null>(null);

  function galleryFor(svc: Service) {
    const gallery = [];
    if (svc.image_path) gallery.push({ image_path: svc.image_path, caption: svc.name });
    for (const img of svc.images || []) gallery.push({ image_path: img.image_path, caption: img.caption });
    return gallery;
  }

  return (
    <>
      <div className="space-y-20">
        {categories.map((cat, i) => (
          <div key={cat.slug} id={cat.slug} className="scroll-mt-24">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-sm font-mono text-brass">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="font-display text-2xl md:text-3xl">{cat.name}</h2>
            </div>
            {cat.description && <p className="text-ink/60 dark:text-stone/60 max-w-2xl mb-8">{cat.description}</p>}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(cat.services || []).map((svc) => {
                const gallery = galleryFor(svc);
                const extraCount = (svc.images || []).length;
                return (
                  <div key={svc.slug} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-6">
                    {svc.image_path && (
                      <button
                        onClick={() => gallery.length > 0 && setLightbox({ service: svc, index: 0 })}
                        className="relative aspect-video mb-4 bg-stoneDark dark:bg-white/5 w-full block group overflow-hidden"
                      >
                        <Image src={imageUrl(svc.image_path)!} alt={svc.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        {extraCount > 0 && (
                          <span className="absolute bottom-2 right-2 bg-ink/70 text-stone text-xs px-2 py-1 flex items-center gap-1">
                            <Images size={12} /> {extraCount + 1}
                          </span>
                        )}
                      </button>
                    )}
                    <h3 className="font-display text-lg mb-2">{svc.name}</h3>
                    {svc.short_description && (
                      <p className="text-sm text-ink/60 dark:text-stone/60">{svc.short_description}</p>
                    )}
                    {svc.starting_price && (
                      <div className="text-xs text-brass font-semibold mt-3">From {svc.starting_price}</div>
                    )}
                    {gallery.length > 1 && (
                      <button
                        onClick={() => setLightbox({ service: svc, index: 0 })}
                        className="text-xs text-brass hover:underline mt-2 flex items-center gap-1"
                      >
                        <Images size={12} /> View all {gallery.length} photos
                      </button>
                    )}
                  </div>
                );
              })}
              {(!cat.services || cat.services.length === 0) && (
                <p className="text-sm text-ink/40 dark:text-stone/50">No services listed yet.</p>
              )}
            </div>
            {i < categories.length - 1 && <div className="seam mt-16" />}
          </div>
        ))}

        {categories.length === 0 && (
          <p className="text-ink/50 dark:text-stone/60">
            No services found — make sure the backend is running and seeded (
            <code className="text-xs">php artisan db:seed</code>).
          </p>
        )}
      </div>

      {lightbox && (
        <ImageLightbox
          images={galleryFor(lightbox.service)}
          startIndex={lightbox.index}
          title={lightbox.service.name}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
