'use client';

import { useState } from 'react';
import Image from 'next/image';
import { imageUrl } from '@/lib/api';
import VideoLightbox from '@/components/VideoLightbox';
import Reveal from '@/components/Reveal';
import HoverCard from '@/components/HoverCard';
import { Play } from 'lucide-react';

type Video = {
  id: number;
  title: string;
  description?: string | null;
  thumbnail_path?: string | null;
  video_path?: string | null;
  video_url?: string | null;
};

export default function VideosGrid({ videos }: { videos: Video[] }) {
  const [playing, setPlaying] = useState<Video | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, i) => (
          <Reveal key={video.id} delay={(i % 6) * 0.08}>
            <HoverCard>
              <button onClick={() => setPlaying(video)} className="text-left group w-full">
                <div className="relative aspect-video bg-ink mb-3 overflow-hidden">
                  {video.thumbnail_path ? (
                    <Image
                      src={imageUrl(video.thumbnail_path)!}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-stoneDark dark:bg-white/5" />
                  )}
                  <div className="absolute inset-0 bg-ink/30 group-hover:bg-ink/40 transition-colors flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-stone/90 group-hover:bg-brass group-hover:scale-110 flex items-center justify-center transition-all duration-300">
                      <Play className="text-ink ml-1" size={22} fill="currentColor" />
                    </span>
                  </div>
                </div>
                <div className="font-display text-lg group-hover:text-brass transition-colors">{video.title}</div>
                {video.description && (
                  <p className="text-sm text-ink/60 dark:text-stone/60 line-clamp-2">{video.description}</p>
                )}
              </button>
            </HoverCard>
          </Reveal>
        ))}
      </div>

      {playing && <VideoLightbox video={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}
