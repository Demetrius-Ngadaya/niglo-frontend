'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { imageUrl } from '@/lib/api';

type Slide = { id: number; title: string; slug: string; image_path: string; description?: string | null };

// A slow, subtle crossfade — deliberately not a left/right slide. Each slide
// sits absolutely stacked on the others and only its opacity changes, over a
// couple of seconds, so the swap is easy to miss rather than an obvious cut.
const INTERVAL_MS = 6000;
const FADE_MS = 2000;

export default function HomeHeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="relative w-full h-[280px] sm:h-[420px] lg:h-[540px] overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 flex items-center justify-center transition-opacity ease-in-out"
          style={{
            opacity: i === index ? 1 : 0,
            transitionDuration: `${FADE_MS}ms`,
            pointerEvents: i === index ? 'auto' : 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(slide.image_path)!}
            alt={slide.title}
            className="max-w-full max-h-full object-contain"
          />

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent pt-16 pb-6 px-6 sm:px-10">
            <div className="max-w-6xl mx-auto flex items-end justify-between gap-4 flex-wrap">
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl text-stone">{slide.title}</h2>
              <Link
                href={`/highlights/${slide.slug}`}
                className="flex-shrink-0 text-sm font-medium px-5 py-2 bg-stone text-ink hover:bg-brass transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
