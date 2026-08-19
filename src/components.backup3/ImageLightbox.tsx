'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { imageUrl } from '@/lib/api';

type LightboxImage = { image_path: string; caption?: string | null };

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export default function ImageLightbox({
  images,
  startIndex,
  title,
  onClose,
}: {
  images: LightboxImage[];
  startIndex: number;
  title?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, zoom]);

  function go(delta: number) {
    setZoom(1);
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }

  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }

  function handleImageClick() {
    setZoom((z) => (z === MIN_ZOOM ? 2 : MIN_ZOOM));
  }

  // Click-and-drag panning once zoomed in.
  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1 || !scrollBoxRef.current) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: scrollBoxRef.current.scrollLeft,
      scrollTop: scrollBoxRef.current.scrollTop,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragRef.current || !scrollBoxRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    scrollBoxRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
    scrollBoxRef.current.scrollTop = dragRef.current.scrollTop - dy;
  }

  function handleMouseUp() {
    dragRef.current = null;
  }

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/95 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 text-stone">
        <div>
          {title && <div className="font-display text-lg">{title}</div>}
          <div className="text-xs text-stone/50">{index + 1} / {images.length}</div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="hover:text-brass disabled:opacity-30 disabled:hover:text-stone"
            aria-label="Zoom out"
          >
            <ZoomOut size={22} />
          </button>
          <span className="text-xs text-stone/60 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="hover:text-brass disabled:opacity-30 disabled:hover:text-stone"
            aria-label="Zoom in"
          >
            <ZoomIn size={22} />
          </button>
          <button onClick={onClose} className="hover:text-brass ml-2" aria-label="Close">
            <X size={24} />
          </button>
        </div>
      </div>

      <div
        ref={scrollBoxRef}
        className="flex-1 relative flex items-center justify-center px-4 pb-4 overflow-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {images.length > 1 && (
          <button
            onClick={() => go(-1)}
            className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 text-stone hover:text-brass z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={36} />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(current.image_path)!}
          alt={current.caption || title || 'Image'}
          onClick={handleImageClick}
          draggable={false}
          style={{ transform: `scale(${zoom})` }}
          className={`transition-transform duration-200 max-w-full max-h-[80vh] object-contain select-none ${
            zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
          }`}
        />

        {images.length > 1 && (
          <button
            onClick={() => go(1)}
            className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 text-stone hover:text-brass z-10"
            aria-label="Next image"
          >
            <ChevronRight size={36} />
          </button>
        )}
      </div>

      {current.caption && (
        <p className="text-center text-stone/60 text-sm pb-4">{current.caption}</p>
      )}

      {images.length > 1 && (
        <div className="flex gap-2 justify-center overflow-x-auto px-4 pb-6">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setZoom(1); setIndex(i); }}
              className={`flex-shrink-0 w-14 h-14 border-2 ${i === index ? 'border-brass' : 'border-transparent opacity-60'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(img.image_path)!} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
