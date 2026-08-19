'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { imageUrl } from '@/lib/api';
import { addToCart, cartCount } from '@/lib/rentalCart';
import ImageLightbox from '@/components/ImageLightbox';
import { ZoomIn, ShoppingBag } from 'lucide-react';

type Item = { id: number; name: string; slug: string; description?: string | null; image_path?: string | null; price_per_day?: string | null };
type Category = { id: number; name: string; items: Item[] };

export default function RentalsGrid({ categories }: { categories: Category[] }) {
  const [lightbox, setLightbox] = useState<Item | null>(null);
  const [count, setCount] = useState(0);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  useEffect(() => {
    setCount(cartCount());
    function onUpdate() {
      setCount(cartCount());
    }
    window.addEventListener('niglo-cart-updated', onUpdate);
    return () => window.removeEventListener('niglo-cart-updated', onUpdate);
  }, []);

  function handleAdd(item: Item) {
    addToCart({ id: item.id, name: item.name, quantity: 1 });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 1200);
  }

  return (
    <>
      <div className="space-y-16">
        {categories.map((cat) => (
          <div key={cat.id}>
            <h2 className="font-display text-2xl mb-6">{cat.name}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(cat.items || []).map((item) => (
                <div key={item.slug} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-6 flex flex-col">
                  {item.image_path && (
                    <button
                      onClick={() => setLightbox(item)}
                      className="relative w-full h-48 mb-4 bg-white flex items-center justify-center overflow-hidden group border border-ink/5 dark:border-stone/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl(item.image_path)!}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                      />
                      <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ZoomIn className="text-stone" size={26} />
                      </span>
                    </button>
                  )}
                  <h3 className="font-display text-lg mb-1">{item.name}</h3>
                  {item.price_per_day && <div className="text-sm text-brass font-semibold mb-3">{item.price_per_day} / day</div>}
                  <button
                    onClick={() => handleAdd(item)}
                    className="mt-auto btn-outline text-sm justify-center"
                  >
                    {justAdded === item.id ? 'Added ✓' : 'Add to Request'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky cart summary — stays in view while scrolling the equipment list,
          but scrolls away naturally with the page content instead of floating
          over the site footer like a fixed viewport bar would. */}
      {count > 0 && (
        <div className="sticky bottom-6 z-30 mt-12 bg-ink text-stone rounded shadow-lg">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-brass" />
              <span className="text-sm">
                {count} item{count > 1 ? 's' : ''} selected for your equipment request
              </span>
            </div>
            <Link href="/request-equipment" className="btn-primary text-sm">
              Continue to Request
            </Link>
          </div>
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={[{ image_path: lightbox.image_path!, caption: lightbox.name }]}
          startIndex={0}
          title={lightbox.name}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
