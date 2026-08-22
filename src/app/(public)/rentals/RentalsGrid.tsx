'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { imageUrl } from '@/lib/api';
import { addToCart, cartCount } from '@/lib/rentalCart';
import ImageLightbox from '@/components/ImageLightbox';
import Reveal from '@/components/Reveal';
import HoverCard from '@/components/HoverCard';
import { ZoomIn, ShoppingBag, Check } from 'lucide-react';

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
            <Reveal>
              <h2 className="font-display text-2xl mb-6">{cat.name}</h2>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(cat.items || []).map((item, i) => (
                <Reveal key={item.slug} delay={(i % 3) * 0.08} y={16}>
                  <HoverCard>
                    <div className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-6 flex flex-col h-full">
                      {item.image_path && (
                        <button
                          onClick={() => setLightbox(item)}
                          className="relative w-full h-48 mb-4 bg-white flex items-center justify-center overflow-hidden group border border-ink/5 dark:border-stone/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl(item.image_path)!}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="text-stone" size={26} />
                          </span>
                        </button>
                      )}
                      <h3 className="font-display text-lg mb-1">{item.name}</h3>
                      {item.price_per_day && <div className="text-sm text-brass font-semibold mb-3">{item.price_per_day} / day</div>}
                      <motion.button
                        onClick={() => handleAdd(item)}
                        whileTap={{ scale: 0.95 }}
                        className="mt-auto btn-outline text-sm justify-center overflow-hidden"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {justAdded === item.id ? (
                            <motion.span
                              key="added"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center gap-1"
                            >
                              <Check size={14} /> Added
                            </motion.span>
                          ) : (
                            <motion.span
                              key="add"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.15 }}
                            >
                              Add to Request
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </HoverCard>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky cart summary — stays in view while scrolling the equipment list,
          but scrolls away naturally with the page content instead of floating
          over the site footer like a fixed viewport bar would. */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="sticky bottom-6 z-30 mt-12 bg-ink text-stone rounded shadow-lg"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

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
