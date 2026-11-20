const VIDLINK_BASE_URL = 'https://vidlink.pro';

export function createCinemaOsPlayerUrl({ mediaType, id, season, episode }) {
  if (!id) return '';

  const encodedId = encodeURIComponent(id);
  const isEpisodic = mediaType === 'tv' || mediaType === 'anime';

  if (!isEpisodic) {
    return `${VIDLINK_BASE_URL}/movie/${encodedId}`;
  }

  if (!season || !episode) return '';

  return `${VIDLINK_BASE_URL}/tv/${encodedId}/${encodeURIComponent(season)}/${encodeURIComponent(episode)}`;
}
