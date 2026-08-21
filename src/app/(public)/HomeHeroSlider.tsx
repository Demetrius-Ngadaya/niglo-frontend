'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { imageUrl } from '@/lib/api';

type Slide = { id: number; title: string; slug: string; image_path: string; description?: string | null };

// A slow, subtle fade — deliberately not a left/right slide, and deliberately
// NOT a fixed-size box. This shows exactly one image at a time, sized by its
// own natural proportions (never cropped, never letterboxed). Sizing is set
// via inline style (not Tailwind classes) specifically so it can never be
// silently overridden by a stale CSS bundle — inline styles always win and
// don't depend on any build step re-running correctly.
const HOLD_MS = 6000;
const FADE_MS = 900;

export default function HomeHeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;

    function cycle() {
      setVisible(false);
      timeoutRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % slides.length);
        setVisible(true);
        timeoutRef.current = setTimeout(cycle, HOLD_MS);
      }, FADE_MS);
    }

    timeoutRef.current = setTimeout(cycle, HOLD_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[index];

  return (
    <div style={{ position: 'relative', width: '100%', background: 'var(--slider-bg, #f3f4f6)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={slide.id}
        src={imageUrl(slide.image_path)!}
        alt={slide.title}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          // No maxHeight here on purpose — that was the actual bug. A cap tied to
          // viewport height meant almost any normal landscape photo needed more
          // height than 75% of a typical screen to display at full width without
          // distortion, so the browser was shrinking the whole image down (width
          // included) to obey the cap — which is exactly the narrow, gutter-heavy
          // look that kept showing up. Letting height be fully natural is the only
          // way to guarantee every image, tall or wide, shows completely undistorted.
          objectFit: 'contain',
          margin: '0 auto',
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
      />

      <div
        className="bg-gradient-to-t from-ink/80 via-ink/30 to-transparent"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: '4rem',
          paddingBottom: '1.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
      >
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
  );
}
