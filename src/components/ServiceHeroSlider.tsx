'use client';

import { useEffect, useRef, useState } from 'react';
import { imageUrl } from '@/lib/api';

type Slide = { id: number; image_path: string; title?: string | null };

// Same proven approach as the homepage's HomeHeroSlider: sized purely by each
// image's own natural proportions (width:100%/height:auto/object-contain, no
// fixed-size box — that combination is what caused the old cropping/gutter
// bug here too), with a slow dim-and-brighten transition instead of a
// left/right slide. Deliberately not SwiperJS — a hand-built transition
// gives full control over how gentle/slow it feels, which matters a lot once
// the image fills the full page width instead of a small confined box.
const HOLD_MS = 7000;
const FADE_MS = 1800;
const DIM_OPACITY = 0.25;

export default function ServiceHeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [dimmed, setDimmed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;

    function cycle() {
      setDimmed(true);
      timeoutRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % slides.length);
        setDimmed(false);
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
        alt={slide.title || 'NIGLOY service'}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          margin: '0 auto',
          opacity: dimmed ? DIM_OPACITY : 1,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
      />

      {slide.title && (
        <div
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: 0,
            right: 0,
            textAlign: 'center',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            opacity: dimmed ? DIM_OPACITY : 1,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        >
          <span className="inline-block bg-ink/70 backdrop-blur-sm text-stone font-display text-lg sm:text-2xl px-6 py-2">
            {slide.title}
          </span>
        </div>
      )}
    </div>
  );
}
