import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePrivateNavigate } from '../hooks/usePrivateNavigate';
import {
  fetchMediaDetails,
  fetchRecommendations,
  fetchSeasonDetails,
  fetchSimilar,
} from '../Api-services/tmbd';

function Stream() {
  const { mediaType = 'movie', id } = useParams();
  const navigate = usePrivateNavigate();

  const [details, setDetails] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState({});
  const [activeTvTab, setActiveTvTab] = useState('episodes'); // 'episodes' | 'similar'
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isPlaying = searchParams.get('play') === '1';
  // Ensure we start at the top whenever this page mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSelectedSeason(null);
        setSeasonEpisodes({});
        if (cancelled) return;

        const data = await fetchMediaDetails(mediaType, id);
        if (cancelled) return;

        setDetails(data);

        const videos = (data.videos && data.videos.results) || [];
        const best =
          videos.find(
            (v) =>
              v.site === 'YouTube' && v.type === 'Trailer' && v.official,
          ) ||
          videos.find(
            (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
          ) ||
          videos.find((v) => v.site === 'YouTube');

        setTrailerKey(best && best.key ? best.key : null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load title.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [id, mediaType]);

  // Load recommendations once details are available, fallback to similar if empty
  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (!details || !id) return;
      try {
        // Try recommendations first
        let recs = await fetchRecommendations(mediaType, id);
        
        // If recommendations are empty, try similar content
        if (!recs || recs.length === 0) {
          recs = await fetchSimilar(mediaType, id);
        }
        
        if (cancelled) return;
        setRecommended(Array.isArray(recs) ? recs : []);
      } catch {
        if (!cancelled) {
          setRecommended([]);
        }
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [details, id, mediaType]);

  // For TV, set default season once details loaded
  useEffect(() => {
    if ((mediaType !== 'tv' && mediaType !== 'anime') || !details) return;

    const seasonsArr = Array.isArray(details.seasons) ? details.seasons : [];
    const defaultSeason =
      seasonsArr.find((s) => s.season_number > 0) || seasonsArr[0];

    if (defaultSeason && selectedSeason === null) {
      setSelectedSeason(defaultSeason.season_number);
    }
  }, [mediaType, details, selectedSeason]);

  // Load episodes for selected season (TV only)
  useEffect(() => {
    if ((mediaType !== 'tv' && mediaType !== 'anime') || !id || selectedSeason == null) return;
    if (seasonEpisodes[selectedSeason]) return;

    let cancelled = false;

    async function loadSeason() {
      try {
        const data = await fetchSeasonDetails(id, selectedSeason);
        if (cancelled) return;
        const eps = Array.isArray(data.episodes) ? data.episodes : [];
        setSeasonEpisodes((prev) => ({
          ...prev,
          [selectedSeason]: eps,
        }));
      } catch {
        // ignore, just no episodes
      }
    }

    loadSeason();

    return () => {
      cancelled = true;
    };
  }, [mediaType, id, selectedSeason, seasonEpisodes]);

  const title =
    details?.title || details?.name || details?.original_title || 'Unknown';

  const backdropUrl = details?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : details?.poster_path
      ? `https://image.tmdb.org/t/p/w1280${details.poster_path}`
      : null;

  const year =
    details?.release_date || details?.first_air_date
      ? new Date(details.release_date || details.first_air_date).getFullYear()
      : null;

  const score =
    typeof details?.vote_average === 'number'
      ? details.vote_average.toFixed(1)
      : null;

  const genresLabel = Array.isArray(details?.genres)
    ? details.genres.map((g) => g.name).filter(Boolean).join(' • ')
    : null;

  let ageRating = null;

  if (mediaType === 'movie' && details?.release_dates?.results) {
    const results = details.release_dates.results;
    const byCountry = (code) =>
      results.find((r) => r.iso_3166_1 === code && Array.isArray(r.release_dates));

    const countryBlock = byCountry('IN') || byCountry('US') || results[0];

    if (countryBlock && Array.isArray(countryBlock.release_dates)) {
      const withCert = countryBlock.release_dates.find(
        (r) => r.certification && r.certification.trim().length > 0,
      );
      if (withCert) {
        ageRating = withCert.certification;
      }
    }
  } else if ((mediaType === 'tv' || mediaType === 'anime') && details?.content_ratings?.results) {
    const results = details.content_ratings.results;
    const byCountry = (code) =>
      results.find((r) => r.iso_3166_1 === code && r.rating);

    const ratingEntry = byCountry('IN') || byCountry('US') || results[0];

    if (ratingEntry && ratingEntry.rating) {
      ageRating = ratingEntry.rating;
    }
  }

  let seasonsLabel = null;
  if (mediaType === 'tv' || mediaType === 'anime') {
    const seasons = details?.number_of_seasons;

    if (seasons) {
      seasonsLabel = `${seasons} season${seasons > 1 ? 's' : ''}`;
    }
  }

  const runtime =
    details?.runtime ||
    (Array.isArray(details?.episode_run_time) &&
      details.episode_run_time[0]);

  const cast =
    (details?.credits && Array.isArray(details.credits.cast)
      ? details.credits.cast.slice(0, 10)
      : []) || [];

  const tvEpisodes =
    (mediaType === 'tv' || mediaType === 'anime') && selectedSeason != null
      ? (seasonEpisodes[selectedSeason] || []).filter((ep) => {
          if (!ep.air_date) return false;
          const todayStr = new Date().toISOString().slice(0, 10);
          return ep.air_date <= todayStr;
        })
      : [];

  const cinemaOsBaseUrl = 'https://cinemaos.tech/player';
  let playerSrc = null;
  if (id) {
    if (mediaType === 'tv' || mediaType === 'anime') {
      const seasonNum = selectedSeason || 1;
      const firstEpisodeNumber =
        (tvEpisodes[0] && tvEpisodes[0].episode_number) || 1;
      const episodeNumber = selectedEpisodeNumber || firstEpisodeNumber;
      playerSrc = `${cinemaOsBaseUrl}/${id}/${seasonNum}/${episodeNumber}?autoplay=1&sidebar=0&mix=0`;
    } else {
      playerSrc = `${cinemaOsBaseUrl}/${id}?autoplay=1&sidebar=0&mix=0`;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="relative w-full h-[60vh] bg-zinc-900 animate-pulse" />
        <div className="px-6 py-6 space-y-3">
          <div className="h-7 w-40 bg-zinc-800 rounded-md" />
          <div className="h-4 w-64 bg-zinc-800 rounded-md" />
          <div className="h-4 w-56 bg-zinc-800 rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
        <p className="mb-4 text-red-400 text-sm">{error || 'Not found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full bg-[#9146FF] hover:bg-[#772ce8] text-sm font-semibold"
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative w-screen h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden left-1/2 -translate-x-1/2">
        {isPlaying ? (
          <div id="video-slot" className="absolute inset-0 bg-black z-20" />
        ) : trailerKey ? (
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                width: '100vw',
                height: '56.25vw', // 16:9 aspect ratio
                minHeight: '100%',
                minWidth: '177.77vh', // 16:9 aspect ratio
              }}
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setTrailerKey(null)}
            />
          </div>
        ) : (
          backdropUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backdropUrl})` }}
            />
          )
        )}

        {!isPlaying && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        )}

        {!isPlaying && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="absolute left-3 top-3 md:left-4 md:top-4 z-20 rounded-full bg-black/90 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm hover:bg-black cursor-pointer border border-white/20 shadow-lg active:scale-95 transition-transform"
            aria-label="Go back"
          >
            ← <span className="hidden sm:inline">Back</span>
          </button>
        )}

        {!isPlaying ? (
          <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-6 sm:px-6 sm:pb-8 md:px-12 md:pb-12 space-y-2 sm:space-y-3 md:space-y-4 max-w-5xl">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent drop-shadow-2xl leading-tight">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm md:text-base text-gray-300">
              {year && <span className="px-2.5 py-1 md:px-3 md:py-1 rounded-full bg-white/10 backdrop-blur-sm">{year}</span>}
              {runtime && (
                <span className="px-2.5 py-1 md:px-3 md:py-1 rounded-full bg-white/10 backdrop-blur-sm">
                  {runtime}
                  min
                </span>
              )}
              {(mediaType === 'tv' || mediaType === 'anime') && <span className="px-2.5 py-1 md:px-3 md:py-1 rounded-full bg-white/10 backdrop-blur-sm">Series</span>}
            </div>
            <p className="max-w-3xl text-sm sm:text-base md:text-lg text-gray-100 leading-relaxed drop-shadow-lg line-clamp-3 md:line-clamp-none">
              {details.overview}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3 md:mt-4">
              <button
                type="button"
                className="group inline-flex items-center px-5 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3.5 rounded-full text-sm sm:text-base md:text-lg font-bold bg-[#9146FF] hover:bg-[#772ce8] transition-all duration-300 shadow-2xl shadow-purple-900/50 cursor-pointer active:scale-95 md:hover:scale-105"
                onClick={() => {
                  setSearchParams({ play: '1' });
                }}
              >
                <span className="mr-2 md:mr-3 text-xl md:text-2xl transition-transform group-hover:scale-110">▶</span>
                <span className="hidden sm:inline">Play Now</span>
                <span className="sm:hidden">Play</span>
              </button>
              {score && (
                <span className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/70 backdrop-blur-sm text-sm sm:text-base font-bold border border-white/10 shadow-xl">
                  <span className="mr-1.5 sm:mr-2 text-yellow-400 text-base sm:text-lg">★</span>
                  <span className="text-white">{score}</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}
      </div>

      {cast.length > 0 && (
        <section className="px-4 md:px-8 pt-4 pb-8 space-y-4">
          {(genresLabel || ageRating || seasonsLabel) && (
            <>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-300 mb-2">
                {genresLabel && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-xs md:text-sm">
                    {genresLabel}
                  </span>
                )}
                {ageRating && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#9146ff]/30 bg-[#9146ff]/10 backdrop-blur-sm text-xs md:text-sm text-purple-200 font-semibold">
                    {ageRating}
                  </span>
                )}
                {seasonsLabel && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-xs md:text-sm">
                    {seasonsLabel}
                  </span>
                )}
              </div>
              <p className="text-[10px] md:text-[11px] text-gray-500 mb-4 max-w-full md:max-w-2xl bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                Note: Audio language may vary by cloud server selected. If no official Hindi server
                is available, try switching to the Flix server.
              </p>
            </>
          )}
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {cast.map((person) => (
              <div
                key={person.id}
                className="flex-shrink-0 w-28 md:w-36 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl overflow-hidden border border-white/5 hover:border-[#9146ff]/30 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                    alt={person.name}
                    className="h-32 md:h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-32 md:h-40 w-full flex items-center justify-center text-xs text-gray-400 bg-zinc-800">
                    {person.name}
                  </div>
                )}
                <div className="px-3 py-2">
                  <p className="text-xs md:text-sm font-semibold truncate text-white">
                    {person.name}
                  </p>
                  {person.character && (
                    <p className="text-[10px] md:text-xs text-gray-400 truncate">
                      as
                      {' '}
                      {person.character}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full-screen player overlay - Mobile optimized */}


      {/* Movie: More like this (poster grid) */}
      {mediaType !== 'tv' && recommended.length > 0 && (
        <section className="px-4 md:px-8 pb-12 space-y-4">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            More Like This
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {recommended.slice(0, 18).map((item) => {
              const img = item.poster_path
                ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                : item.backdrop_path
                  ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                  : null;
              const recTitle =
                item.title || item.name || item.original_title || 'Untitled';

              return (
                <button
                  type="button"
                  key={item.id}
                  className="group bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-lg overflow-hidden text-left hover:scale-105 hover:z-10 transition-all duration-300 cursor-pointer border border-white/5 hover:border-[#9146ff]/30 shadow-lg"
                  onClick={() => navigate(`/stream/${mediaType}/${item.id}`)}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={recTitle}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] flex items-center justify-center text-xs text-gray-300 px-2 text-center bg-zinc-800">
                      {recTitle}
                    </div>
                  )}
                  <div className="px-2 py-2">
                    <p className="text-xs md:text-sm font-semibold truncate text-white">
                      {recTitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* TV: Episodes / Similar */}
      {mediaType === 'tv' && (
        <section className="px-4 md:px-8 pb-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
            <div className="flex w-full md:w-auto md:min-w-[260px] text-sm md:text-base rounded-full border border-gray-700 bg-black/40 overflow-hidden">
              <button
                type="button"
                className={`flex-1 py-1.5 md:py-2 text-center ${
                  activeTvTab === 'episodes'
                    ? 'bg-[#9146FF] text-white'
                    : 'bg-transparent text-gray-400'
                }`}
                onClick={() => setActiveTvTab('episodes')}
              >
                Episodes
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 md:py-2 text-center ${
                  activeTvTab === 'similar'
                    ? 'bg-[#9146FF] text-white'
                    : 'bg-transparent text-gray-400'
                }`}
                onClick={() => setActiveTvTab('similar')}
              >
                Similar
              </button>
            </div>

            {activeTvTab === 'episodes' &&
              Array.isArray(details.seasons) &&
              details.seasons.length > 0 && (
                <select
                  value={selectedSeason ?? ''}
                  onChange={(e) => {
                    setSelectedSeason(Number(e.target.value));
                    setSelectedEpisodeNumber(null);
                  }}
                  className="ml-4 rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs md:text-sm"
                >
                  {details.seasons
                    .filter((s) => s.season_number > 0)
                    .map((s) => (
                      <option
                        key={s.id || s.season_number}
                        value={s.season_number}
                      >
                        Season
                        {' '}
                        {s.season_number}
                      </option>
                    ))}
                </select>
            )}
          </div>

          {activeTvTab === 'episodes' ? (
            <div className="space-y-3">
              {tvEpisodes.map((ep) => {
                const still = ep.still_path
                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                  : null;
                const isSelected =
                  selectedEpisodeNumber === ep.episode_number;

                return (
                  <div
                    key={ep.id}
                    className={`group flex gap-3 rounded-lg p-2 md:p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-zinc-800' : 'bg-zinc-900/60 hover:bg-zinc-800/80'
                    }`}
                    onClick={() => {
                      setSelectedEpisodeNumber(ep.episode_number);
                      setSearchParams({ play: '1' });
                    }}
                  >
                    {still && (
                      <div className="relative h-20 w-32 rounded-md overflow-hidden">
                        <img
                          src={still}
                          alt={ep.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#9146FF] text-white text-xs font-bold">
                            ▶
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs md:text-sm text-gray-200">
                        <span className="font-semibold">
                          {ep.episode_number}
                          .&nbsp;
                          {ep.name}
                        </span>
                        {ep.runtime && (
                          <span className="text-gray-400">
                            {ep.runtime}
                            min
                          </span>
                        )}
                      </div>
                      {ep.overview && (
                        <p className="text-[11px] md:text-xs text-gray-300 line-clamp-2">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {tvEpisodes.length === 0 && (
                <p className="text-xs text-gray-400">
                  No episode information available for this season.
                </p>
              )}
            </div>
          ) : (
            recommended.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                {recommended.slice(0, 18).map((item) => {
                  const img = item.poster_path
                    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                    : item.backdrop_path
                      ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                      : null;
                  const recTitle =
                    item.title || item.name || item.original_title || 'Untitled';

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className="bg-zinc-900 rounded-lg overflow-hidden text-left hover:scale-[1.02] hover:z-10 transition-transform cursor-pointer"
                      onClick={() => navigate(`/stream/tv/${item.id}`)}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={recTitle}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] flex items-center justify-center text-xs text-gray-300 px-2 text-center">
                          {recTitle}
                        </div>
                      )}
                      <div className="px-2 py-1">
                        <p className="text-[11px] md:text-xs font-semibold truncate">
                          {recTitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </section>
      )}
    </div>
  );
}

export default Stream;
