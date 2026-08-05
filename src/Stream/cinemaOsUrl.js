const CINEMAOS_PROXY_BASE_URL = '/api/cinemaos/watch';

export function createCinemaOsPlayerUrl({ mediaType, id, season, episode }) {
  if (!id) return '';

  const encodedId = encodeURIComponent(id);
  const isEpisodic = mediaType === 'tv' || mediaType === 'anime';

  if (!isEpisodic) {
    return `${CINEMAOS_PROXY_BASE_URL}/movie/${encodedId}`;
  }

  if (!season || !episode) return '';

  const searchParams = new URLSearchParams({
    season: String(season),
    episode: String(episode),
  });

  return `${CINEMAOS_PROXY_BASE_URL}/tv/${encodedId}?${searchParams}`;
}
