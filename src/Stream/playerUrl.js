const VIDLINK_BASE_URL = 'https://vidlink.pro';
// multiLang=true asks the player for streams with extra audio languages (dubs).
const VIDLINK_OPTIONS = '?multiLang=true';

export function createPlayerUrl({ mediaType, id, season, episode }) {
  if (!id) return '';

  const encodedId = encodeURIComponent(id);
  const isEpisodic = mediaType === 'tv' || mediaType === 'anime';

  if (!isEpisodic) {
    return `${VIDLINK_BASE_URL}/movie/${encodedId}${VIDLINK_OPTIONS}`;
  }

  if (!season || !episode) return '';

  return `${VIDLINK_BASE_URL}/tv/${encodedId}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}${VIDLINK_OPTIONS}`;
}
