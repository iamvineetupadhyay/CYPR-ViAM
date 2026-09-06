/**
 * CYPR ViAM Media Source Detection & Curated Watchlist
 */

export function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function detectSourceType(url) {
  if (!url) return 'direct';
  if (extractYouTubeId(url)) return 'youtube';
  if (/\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(url)) return 'direct';
  return 'embed'; // Generic web stream / HDHub4u embed iframe
}

export const CURATED_COUPLE_PICKS = [
  {
    title: 'Interstellar (4K Official Trailer)',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    category: 'Sci-Fi'
  },
  {
    title: 'Lofi Chill Beats - Ambient Piano',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    category: 'Vibes'
  },
  {
    title: 'Inception (Official Trailer 4K)',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    category: 'Sci-Fi'
  },
  {
    title: 'Tears of Steel (Sci-Fi 1080p Stream)',
    type: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Sci-Fi'
  }
];

export const HDHUB4U_TOP_PICKS = [
  {
    title: 'Margin Call (2011) [Hindi Multi Audio 1080p]',
    type: 'direct',
    url: 'https://new5.hdhub4u.cl/margin-call-2011-bluray-hindi-full-movie/',
    category: 'Thriller / Wall Street',
    isHdhubLive: true
  },
  {
    title: 'The Runner (2026) [Hindi & English Dual Audio]',
    type: 'direct',
    url: 'https://new5.hdhub4u.cl/the-runner-2026-hindi-webrip-full-movie/',
    category: 'Action Mystery',
    isHdhubLive: true
  },
  {
    title: 'The Bridge on the River Kwai (1957) [Hindi Dual Audio]',
    type: 'direct',
    url: 'https://new5.hdhub4u.cl/the-bridge-on-the-river-kwai-1957-bluray-hindi-full-movie/',
    category: 'War Classic',
    isHdhubLive: true
  },
  {
    title: 'Tears of Steel (Sci-Fi 4K Cinema)',
    type: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    category: 'Sci-Fi Action'
  },
  {
    title: 'Sintel (Fantasy Drama 4K)',
    type: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    category: 'Romance & Fantasy'
  },
  {
    title: 'Big Buck Bunny (Animation 4K Ultra HD)',
    type: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    category: 'Animated'
  },
  {
    title: 'Elephant Dream (Sci-Fi 1080p Cinema)',
    type: 'direct',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Drama Classic'
  }
];

