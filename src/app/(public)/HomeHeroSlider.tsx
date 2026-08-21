'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { imageUrl } from '@/lib/api';

type Slide = { id: number; title: string; slug: string; image_path: string; description?: string | null };

// A slow, gentle dim-and-brighten — deliberately not a left/right slide, and
// deliberately NOT a fixed-size box (that combination is what caused the
// earlier cropping/gutter bug). Sized purely by the image's own natural
// proportions via width:100%/height:auto — never cropped, never letterboxed.
//
// The transition never fully hides the image (it dips to a low opacity
// rather than 0) and runs slowly, so swapping to the next slide reads as a
// soft breathing motion rather than a visible "blink" — this matters more
// now that the image fills the full page width instead of a small confined
// box, since the same transition is far more noticeable across a larger
// visual area.
const HOLD_MS = 7000;
const FADE_MS = 1800;
const DIM_OPACITY = 0.25;

export default function HomeHeroSlider({ slides }: { slides: Slide[] }) {
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
        alt={slide.title}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          // No maxHeight here on purpose — a cap tied to viewport height meant
          // almost any normal landscape photo needed more height than the cap
          // allowed to display at full width without distortion, so the browser
          // was shrinking the whole image down (width included) to obey it —
          // exactly the narrow, gutter-heavy look that kept showing up. Letting
          // height be fully natural is the only way to guarantee every image,
          // tall or wide, shows completely undistorted.
          objectFit: 'contain',
          margin: '0 auto',
          opacity: dimmed ? DIM_OPACITY : 1,
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
          opacity: dimmed ? DIM_OPACITY : 1,
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
