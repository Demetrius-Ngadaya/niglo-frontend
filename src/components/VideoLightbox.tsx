'use client';

import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { imageUrl } from '@/lib/api';
import { detectVideoSource } from '@/lib/video';

type Video = {
  title: string;
  video_path?: string | null;
  video_url?: string | null;
};

export default function VideoLightbox({ video, onClose }: { video: Video; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const source = detectVideoSource(video.video_path, video.video_url);

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/95 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 text-stone">
        <div className="font-display text-lg">{video.title}</div>
        <button onClick={onClose} className="hover:text-brass" aria-label="Close">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-6">
        <div className="w-full max-w-4xl">
          {source.type === 'upload' && video.video_path && (
            <video
              src={imageUrl(video.video_path)!}
              controls
              autoPlay
              className="w-full max-h-[75vh] bg-black"
            />
          )}

          {source.type === 'youtube' && (
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={`${source.embedUrl}?autoplay=1`}
                title={video.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          )}

          {source.type === 'vimeo' && (
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={`${source.embedUrl}?autoplay=1`}
                title={video.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          )}

          {source.type === 'external' && (
            <div className="text-center py-16">
              <p className="text-stone/70 mb-6">
                This video is hosted on {source.platform} — watch it there.
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex"
              >
                Watch on {source.platform}
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
