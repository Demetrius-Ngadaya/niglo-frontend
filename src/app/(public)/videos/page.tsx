import { api } from '@/lib/api';
import VideosGrid from './VideosGrid';

type Video = {
  id: number;
  title: string;
  description?: string | null;
  thumbnail_path?: string | null;
  video_path?: string | null;
  video_url?: string | null;
};

async function getVideos(): Promise<Video[]> {
  try {
    const { data } = await api.get('/videos');
    return data;
  } catch {
    return [];
  }
}

export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">See it in motion</div>
      <h1 className="font-display text-4xl md:text-5xl mb-16">Videos</h1>

      <VideosGrid videos={videos} />

      {videos.length === 0 && <p className="text-ink/50 dark:text-stone/60">No videos published yet.</p>}
    </div>
  );
}
