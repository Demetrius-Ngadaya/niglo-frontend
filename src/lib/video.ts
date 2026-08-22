// Detects which platform a pasted video link is from, so the player can pick
// the right embed strategy. YouTube and Vimeo get a proper inline iframe
// player; anything else (Facebook, Instagram, TikTok, or any other link)
// falls back to a "Watch on [Platform]" button that opens the original link —
// embedding those reliably requires their own SDKs, which isn't worth the
// complexity here.

export type VideoSource =
  | { type: 'upload' }
  | { type: 'youtube'; embedUrl: string }
  | { type: 'vimeo'; embedUrl: string }
  | { type: 'external'; url: string; platform: string };

export function detectVideoSource(videoPath?: string | null, videoUrl?: string | null): VideoSource {
  if (videoPath) return { type: 'upload' };
  if (!videoUrl) return { type: 'external', url: '', platform: 'Link' };

  const youtubeMatch = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  if (youtubeMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}` };
  }

  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  let platform = 'the original site';
  if (/facebook\.com|fb\.watch/.test(videoUrl)) platform = 'Facebook';
  else if (/instagram\.com/.test(videoUrl)) platform = 'Instagram';
  else if (/tiktok\.com/.test(videoUrl)) platform = 'TikTok';
  else if (/twitter\.com|x\.com/.test(videoUrl)) platform = 'X';

  return { type: 'external', url: videoUrl, platform };
}
